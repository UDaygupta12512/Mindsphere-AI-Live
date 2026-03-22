import express from 'express';
import crypto from 'crypto';
import Course from '../models/Course.js';
import User from '../models/User.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// In-memory store for certificates (in production, use a DB collection)
// For now, we generate them on-the-fly from course completion data
const certificateCache = new Map();

const isCourseCompleted = (course) => {
  const totalLessons = course.lessons?.length || 0;
  const completedLessons = course.lessons?.filter(l => l.isCompleted).length || 0;
  return course.progress >= 100 || (totalLessons > 0 && completedLessons >= totalLessons);
};

const createVerificationCode = (userId, courseId) => {
  return crypto
    .createHash('sha256')
    .update(`${userId}:${courseId}:mindsphere-certificate`)
    .digest('hex')
    .slice(0, 8)
    .toUpperCase();
};

const buildCertificate = ({ userId, course, userName }) => {
  return {
    id: `cert-${course._id}`,
    courseId: course._id.toString(),
    courseTitle: course.title,
    userName,
    completionDate: course.updatedAt || new Date(),
    certificateUrl: '', // Generated on client-side with jsPDF
    verificationCode: createVerificationCode(userId, course._id.toString()),
    issuedBy: 'MindSphere AI',
    expiresAt: null
  };
};

const getCertificatesForUser = async (userId) => {
  const [courses, user] = await Promise.all([
    Course.find({ user: userId }),
    User.findById(userId)
  ]);

  const userName = user?.name || 'Student';
  const certificates = [];

  for (const course of courses) {
    if (!isCourseCompleted(course) || !course.certificate) {
      continue;
    }

    const cacheKey = `${userId}-${course._id.toString()}`;
    let certificate = certificateCache.get(cacheKey);

    if (!certificate) {
      certificate = buildCertificate({ userId, course, userName });
      certificateCache.set(cacheKey, certificate);
    }

    certificates.push(certificate);
  }

  return certificates;
};

// POST /api/certificates/generate/:courseId - Generate certificate for completed course
router.post('/generate/:courseId', authMiddleware, async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.userId;

    const course = await Course.findOne({ _id: courseId, user: userId });
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const totalLessons = course.lessons?.length || 0;
    const completedLessons = course.lessons?.filter(l => l.isCompleted).length || 0;
    const isCompleted = isCourseCompleted(course);

    if (!isCompleted) {
      return res.status(400).json({ 
        error: 'Course must be completed before generating a certificate',
        progress: course.progress,
        completedLessons,
        totalLessons
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!course.certificate) {
      course.certificate = true;
      await course.save();
    }

    // Generate or retrieve existing certificate
    const cacheKey = `${userId}-${course._id.toString()}`;
    let certificate = certificateCache.get(cacheKey);

    if (!certificate) {
      certificate = buildCertificate({
        userId,
        course,
        userName: user.name
      });
      certificateCache.set(cacheKey, certificate);
    }

    res.json(certificate);
  } catch (error) {
    console.error('Generate certificate error:', error);
    res.status(500).json({ error: 'Failed to generate certificate' });
  }
});

// GET /api/certificates - Get all certificates for current user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const certificates = await getCertificatesForUser(userId);

    res.json(certificates);
  } catch (error) {
    console.error('Get certificates error:', error);
    res.status(500).json({ error: 'Failed to fetch certificates' });
  }
});

// GET /api/certificates/verify/:code - Verify a certificate (public, no auth required)
router.get('/verify/:code', async (req, res) => {
  try {
    const { code } = req.params;

    // Search all courses for completed ones with matching verification code
    const courses = await Course.find({}).populate('user', 'name');

    for (const course of courses) {
      if (!isCourseCompleted(course) || !course.certificate) continue;

      const userId = course.user?._id?.toString() || course.user?.toString();
      const verificationCode = createVerificationCode(userId, course._id.toString());

      if (verificationCode === code) {
        const userName = course.user?.name || 'Student';
        const certificate = buildCertificate({ userId, course, userName });
        return res.json({ valid: true, certificate });
      }
    }

    res.json({ valid: false });
  } catch (error) {
    console.error('Verify certificate error:', error);
    res.status(500).json({ error: 'Failed to verify certificate' });
  }
});

// GET /api/certificates/:id - Get specific certificate
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const certificates = await getCertificatesForUser(req.userId);
    const certificate = certificates.find(cert => cert.id === req.params.id);

    if (!certificate) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    res.json(certificate);
  } catch (error) {
    console.error('Get certificate error:', error);
    res.status(500).json({ error: 'Failed to fetch certificate' });
  }
});

export default router;
