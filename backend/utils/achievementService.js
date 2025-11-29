const User = require('../models/User');
const Achievement = require('../models/Achievement');
const Course = require('../models/Course');

async function checkAndAwardAchievements(userId, eventType, eventData = {}) {
  try {
    const user = await User.findById(userId);
    if (!user) return [];

    const achievements = await Achievement.find({ isActive: true });
    const earnedAchievementIds = user.earnedAchievements.map(a => a.achievementId.toString());
    const newlyEarnedAchievements = [];

    for (const achievement of achievements) {
      if (earnedAchievementIds.includes(achievement._id.toString())) {
        continue;
      }

      const isMet = await checkAchievementCondition(user, achievement, eventData);

      if (isMet) {
        user.earnedAchievements.push({
          achievementId: achievement._id,
          earnedAt: new Date()
        });
        newlyEarnedAchievements.push(achievement);
      }
    }

    if (newlyEarnedAchievements.length > 0) {
      await user.save();
    }

    return newlyEarnedAchievements;
  } catch (error) {
    console.error('Error checking achievements:', error);
    return [];
  }
}

async function checkAchievementCondition(user, achievement, eventData) {
  const { conditionType, conditionValue } = achievement;

  switch (conditionType) {
    case 'first_lesson':
      const totalLessons = user.courseProgress.reduce((sum, cp) =>
        sum + (cp.completedLessons?.length || 0), 0);
      return totalLessons >= 1;

    case 'lessons_completed':
      const lessonsCompleted = user.courseProgress.reduce((sum, cp) =>
        sum + (cp.completedLessons?.length || 0), 0);
      return lessonsCompleted >= parseInt(conditionValue);

    case 'first_course':
      const completedCourses = user.courseProgress.filter(cp => cp.completedAt);
      return completedCourses.length >= 1;

    case 'course_completed':
      const coursesCompleted = user.courseProgress.filter(cp => cp.completedAt).length;
      return coursesCompleted >= parseInt(conditionValue);

    case 'specific_course':
      const specificCourse = user.courseProgress.find(cp =>
        cp.courseId.toString() === conditionValue.toString() && cp.completedAt
      );
      return !!specificCourse;

    case 'streak_days':
      return (user.loginStreak?.currentStreak || 0) >= parseInt(conditionValue);

    case 'watch_time':
      return false;

    default:
      return false;
  }
}

async function calculateAchievementProgress(user, achievement) {
  const { conditionType, conditionValue } = achievement;

  switch (conditionType) {
    case 'first_lesson':
      const totalLessons = user.courseProgress.reduce((sum, cp) =>
        sum + (cp.completedLessons?.length || 0), 0);
      return { current: Math.min(totalLessons, 1), target: 1 };

    case 'lessons_completed':
      const lessonsCompleted = user.courseProgress.reduce((sum, cp) =>
        sum + (cp.completedLessons?.length || 0), 0);
      return { current: lessonsCompleted, target: parseInt(conditionValue) };

    case 'first_course':
      const completedCourses = user.courseProgress.filter(cp => cp.completedAt).length;
      return { current: Math.min(completedCourses, 1), target: 1 };

    case 'course_completed':
      const coursesCompleted = user.courseProgress.filter(cp => cp.completedAt).length;
      return { current: coursesCompleted, target: parseInt(conditionValue) };

    case 'specific_course':
      const specificCourse = user.courseProgress.find(cp =>
        cp.courseId.toString() === conditionValue.toString()
      );
      if (!specificCourse) return { current: 0, target: 1 };

      try {
        const course = await Course.findById(conditionValue);
        if (!course) return { current: 0, target: 1 };

        const completed = specificCourse.completedLessons?.length || 0;
        const total = course.lessons?.length || 1;
        return { current: completed, target: total };
      } catch (error) {
        return { current: 0, target: 1 };
      }

    case 'streak_days':
      return {
        current: user.loginStreak?.currentStreak || 0,
        target: parseInt(conditionValue)
      };

    default:
      return { current: 0, target: 1 };
  }
}

module.exports = {
  checkAndAwardAchievements,
  calculateAchievementProgress
};
