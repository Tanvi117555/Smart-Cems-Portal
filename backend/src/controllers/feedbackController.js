const { db } = require('../config/firebase');

/**
 * Get Feedback Form for Event
 */
const getFeedbackForm = async (req, res) => {
  try {
    const { eventId } = req.params;
    const studentId = req.user ? req.user.id : null;

    // Fetch active form for event
    const formSnapshot = await db.collection('events').doc(eventId)
      .collection('feedbackForms')
      .where('status', 'in', ['active', 'published'])
      .limit(1)
      .get();

    if (formSnapshot.empty) {
      return res.status(404).json({ success: false, message: 'No active feedback form found for this event.' });
    }

    const formDoc = formSnapshot.docs[0];
    const formData = { id: formDoc.id, ...formDoc.data() };

    // Fetch questions
    const questionsSnapshot = await formDoc.ref.collection('questions').get();

    const questions = [];
    questionsSnapshot.forEach(doc => {
      const q = doc.data();
      if (!q.isArchived) {
        questions.push({ id: doc.id, ...q });
      }
    });

    questions.sort((a, b) => (a.order || 0) - (b.order || 0));
    formData.questions = questions;

    // Check if student has already submitted for this form version
    let hasSubmitted = false;
    if (studentId) {
      const responseCheck = await db.collection('feedbackResponses')
        .where('formId', '==', formDoc.id)
        .where('studentId', '==', studentId)
        .limit(1)
        .get();

      hasSubmitted = !responseCheck.empty;
    }

    return res.json({
      success: true,
      form: {
        ...formData,
        has_submitted: hasSubmitted
      }
    });
  } catch (error) {
    console.error('GetFeedbackForm Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve feedback form.' });
  }
};

/**
 * Save / Update Feedback Form (Version-Safe: Never wipes past responses!)
 */
const saveFeedbackForm = async (req, res) => {
  try {
    const { event_id, title, description, questions = [] } = req.body;
    const userId = req.user.id;

    if (!event_id || !title) {
      return res.status(400).json({ success: false, message: 'Event ID and Form Title are required.' });
    }

    const eventRef = db.collection('events').doc(event_id);
    const existingForms = await eventRef.collection('feedbackForms').get();

    let targetFormRef;
    let currentVersion = 1;

    if (!existingForms.empty) {
      // Find latest version
      const sorted = existingForms.docs.sort((a, b) => (b.data().version || 1) - (a.data().version || 1));
      const latestDoc = sorted[0];
      const latestData = latestDoc.data();

      // Check if responses already exist for the latest form
      const existingResponses = await db.collection('feedbackResponses')
        .where('formId', '==', latestDoc.id)
        .limit(1)
        .get();

      if (!existingResponses.empty) {
        // RESPONSES EXIST: ARCHIVE PREVIOUS AND CREATE NEW VERSION!
        await latestDoc.ref.update({ status: 'archived', updatedAt: new Date().toISOString() });
        currentVersion = (latestData.version || 1) + 1;
        targetFormRef = eventRef.collection('feedbackForms').doc();
      } else {
        // No responses yet: safe to update in-place
        targetFormRef = latestDoc.ref;
        currentVersion = latestData.version || 1;
      }
    } else {
      targetFormRef = eventRef.collection('feedbackForms').doc();
    }

    await targetFormRef.set({
      eventId: event_id,
      title: title.trim(),
      description: description || '',
      version: currentVersion,
      status: 'active',
      createdBy: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }, { merge: true });

    // Save Questions with Soft Archival / Clean Replacement
    const questionsCol = targetFormRef.collection('questions');
    const existingQDocs = await questionsCol.get();

    // Mark existing questions as archived instead of hard DELETE
    const batch = db.batch();
    existingQDocs.forEach(qDoc => {
      batch.update(qDoc.ref, { isArchived: true });
    });

    // Insert new questions
    questions.forEach((q, idx) => {
      const newQRef = questionsCol.doc();
      batch.set(newQRef, {
        questionText: q.questionText || q.question_text || '',
        questionType: q.questionType || q.question_type || 'rating',
        required: q.required !== undefined ? q.required : true,
        options: q.options || [],
        order: idx + 1,
        isArchived: false,
        createdAt: new Date().toISOString()
      });
    });

    await batch.commit();

    return res.json({
      success: true,
      message: `Feedback form version ${currentVersion} saved successfully!`,
      formId: targetFormRef.id,
      version: currentVersion
    });
  } catch (error) {
    console.error('SaveFeedbackForm Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to save feedback form.' });
  }
};

/**
 * Submit Feedback Response (Student)
 */
const submitFeedbackResponse = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { formId, eventId, answers } = req.body;

    if (!formId || !answers || !Array.isArray(answers)) {
      return res.status(400).json({ success: false, message: 'Form ID and answers array are required.' });
    }

    // Check duplicate submission
    const existing = await db.collection('feedbackResponses')
      .where('formId', '==', formId)
      .where('studentId', '==', studentId)
      .limit(1)
      .get();

    if (!existing.empty) {
      return res.status(400).json({ success: false, message: 'You have already submitted feedback for this event.' });
    }

    const now = new Date().toISOString();
    const responseRef = db.collection('feedbackResponses').doc();

    const batch = db.batch();

    // Create main response record
    batch.set(responseRef, {
      formId,
      eventId: eventId || null,
      studentId,
      studentName: req.user.name,
      studentEmail: req.user.email,
      submittedAt: now
    });

    // Create individual answers
    answers.forEach(ans => {
      const ansRef = db.collection('feedbackAnswers').doc();
      batch.set(ansRef, {
        responseId: responseRef.id,
        formId,
        questionId: ans.questionId || ans.question_id,
        answerText: String(ans.answerText !== undefined ? ans.answerText : (ans.answer || '')),
        createdAt: now
      });
    });

    await batch.commit();

    return res.json({
      success: true,
      message: 'Thank you! Your feedback has been recorded successfully.'
    });
  } catch (error) {
    console.error('SubmitFeedbackResponse Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to submit feedback.' });
  }
};

/**
 * Feedback Analytics Dashboard (Faculty / Admin)
 * Returns Recharts-ready data for ratings, distributions, and question breakdowns
 */
const getFeedbackAnalytics = async (req, res) => {
  try {
    const { eventId } = req.params;

    const formsSnapshot = await db.collection('events').doc(eventId)
      .collection('feedbackForms')
      .get();

    if (formsSnapshot.empty) {
      return res.json({
        success: true,
        analytics: {
          totalResponses: 0,
          averageRating: 0,
          ratingDistribution: [
            { rating: '5 Stars', count: 0 },
            { rating: '4 Stars', count: 0 },
            { rating: '3 Stars', count: 0 },
            { rating: '2 Stars', count: 0 },
            { rating: '1 Star', count: 0 }
          ],
          questions: [],
          recentComments: []
        }
      });
    }

    const formIds = formsSnapshot.docs.map(d => d.id);

    // Fetch all responses across versions
    const responsesSnapshot = await db.collection('feedbackResponses')
      .where('formId', 'in', formIds)
      .get();

    const totalResponses = responsesSnapshot.size;
    if (totalResponses === 0) {
      return res.json({
        success: true,
        analytics: {
          totalResponses: 0,
          averageRating: 0,
          ratingDistribution: [
            { rating: '5 Stars', count: 0 },
            { rating: '4 Stars', count: 0 },
            { rating: '3 Stars', count: 0 },
            { rating: '2 Stars', count: 0 },
            { rating: '1 Star', count: 0 }
          ],
          questions: [],
          recentComments: []
        }
      });
    }

    // Fetch all answers
    const answersSnapshot = await db.collection('feedbackAnswers')
      .where('formId', 'in', formIds)
      .get();

    const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let ratingSum = 0;
    let ratingTotal = 0;
    const comments = [];

    answersSnapshot.forEach(doc => {
      const ans = doc.data();
      const numVal = parseInt(ans.answerText, 10);
      if (!isNaN(numVal) && numVal >= 1 && numVal <= 5) {
        ratingCounts[numVal] = (ratingCounts[numVal] || 0) + 1;
        ratingSum += numVal;
        ratingTotal++;
      } else if (ans.answerText && ans.answerText.length > 5) {
        comments.push({
          text: ans.answerText,
          date: ans.createdAt
        });
      }
    });

    const averageRating = ratingTotal > 0 ? (ratingSum / ratingTotal).toFixed(1) : '5.0';

    const ratingDistribution = [
      { rating: '5 Stars', count: ratingCounts[5] || 0 },
      { rating: '4 Stars', count: ratingCounts[4] || 0 },
      { rating: '3 Stars', count: ratingCounts[3] || 0 },
      { rating: '2 Stars', count: ratingCounts[2] || 0 },
      { rating: '1 Star', count: ratingCounts[1] || 0 }
    ];

    return res.json({
      success: true,
      analytics: {
        totalResponses,
        averageRating: parseFloat(averageRating),
        ratingDistribution,
        recentComments: comments.slice(0, 15)
      }
    });
  } catch (error) {
    console.error('GetFeedbackAnalytics Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load feedback analytics.' });
  }
};

module.exports = {
  getFeedbackForm,
  saveFeedbackForm,
  submitFeedbackResponse,
  getFeedbackAnalytics
};
