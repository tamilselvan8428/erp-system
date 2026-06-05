import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';

const runTests = async () => {
  console.log('🧪 Starting Database and Model Tests...');
  
  // Set USE_MOCK_DB manually to true to run tests in mock mode
  process.env.USE_MOCK_DB = 'true';
  await connectDB();

  try {
    // 1. Clean up test users if they exist
    await User.deleteOne({ email: 'test_user@sece.ac.in' });

    // 2. Create User
    console.log(' - Testing User Creation...');
    const user = await User.create({
      name: 'Test Professor',
      email: 'test_user@sece.ac.in',
      password: 'hashedpassword',
      role: 'Faculty',
      department: 'CSE',
      academicYear: '2025-2026',
      active: true,
      apiScore: 0,
      monthlyClosureStatus: []
    });
    console.log(`   ✅ User created with ID: ${user._id}`);

    // 3. Find User
    console.log(' - Testing Find Operations...');
    const found = await User.findOne({ email: 'test_user@sece.ac.in' });
    if (!found || found.name !== 'Test Professor') {
      throw new Error('Find failed: User properties do not match.');
    }
    console.log('   ✅ FindOne verified.');

    // 4. Update User
    console.log(' - Testing Update Operations...');
    const updated = await User.findByIdAndUpdate(user._id, { apiScore: 100 }, { new: true });
    if (!updated || updated.apiScore !== 100) {
      throw new Error('Update failed: score not updated.');
    }
    console.log('   ✅ Update verified.');

    // 5. Delete User
    console.log(' - Testing Delete Operations...');
    const delResult = await User.deleteOne({ _id: user._id });
    if (delResult.deletedCount !== 1) {
      throw new Error('Delete failed.');
    }
    console.log('   ✅ Delete verified.');

    console.log('🎉 ALL DATABASE TESTS PASSED SUCCESSFULLY!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Database Test Failed:', err.message);
    process.exit(1);
  }
};

runTests();
