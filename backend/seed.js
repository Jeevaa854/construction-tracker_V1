import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Project from './models/Project.js';
import Task from './models/Task.js';

dotenv.config();

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/construction_tracker');
    console.log('MongoDB Connected');

    // Clear existing data
    await User.deleteMany({});
    await Project.deleteMany({});
    await Task.deleteMany({});
    console.log('Cleared existing data');

    // Create admin user
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@test.com',
      password: 'password123',
      phone: '+1 555 000 0001',
      role: 'admin',
    });
    console.log('✓ Created admin:', admin.email);

    // Create manager users
    const manager1 = await User.create({
      name: 'John Manager',
      email: 'manager@test.com',
      password: 'password123',
      phone: '+1 555 000 0002',
      role: 'manager',
    });
    console.log('✓ Created manager:', manager1.email);

    // Create worker users
    const worker1 = await User.create({
      name: 'Alice Worker',
      email: 'worker1@test.com',
      password: 'password123',
      phone: '+1 555 000 0003',
      role: 'worker',
    });
    console.log('✓ Created worker 1:', worker1.email);

    const worker2 = await User.create({
      name: 'Bob Worker',
      email: 'worker2@test.com',
      password: 'password123',
      phone: '+1 555 000 0004',
      role: 'worker',
    });
    console.log('✓ Created worker 2:', worker2.email);

    // Create projects
    const project1 = await Project.create({
      name: 'Downtown Plaza Renovation',
      description: 'Complete renovation of the downtown plaza including landscaping and infrastructure upgrades',
      manager: manager1._id,
      workers: [worker1._id, worker2._id],
      status: 'in-progress',
      priority: 'high',
      startDate: new Date('2026-01-15'),
      endDate: new Date('2026-06-30'),
      estimatedBudget: 500000,
      actualBudget: 350000,
      completionPercentage: 65,
      createdBy: manager1._id,
    });
    console.log('✓ Created project 1:', project1.name);

    const project2 = await Project.create({
      name: 'Bridge Infrastructure Update',
      description: 'Safety inspection and infrastructure updates for the central bridge',
      manager: manager1._id,
      workers: [worker1._id],
      status: 'planning',
      priority: 'medium',
      startDate: new Date('2026-03-01'),
      endDate: new Date('2026-12-31'),
      estimatedBudget: 750000,
      actualBudget: 50000,
      completionPercentage: 5,
      createdBy: manager1._id,
    });
    console.log('✓ Created project 2:', project2.name);

    // Create tasks for project 1
    const task1 = await Task.create({
      title: 'Site Preparation',
      description: 'Clear and prepare the construction site',
      project: project1._id,
      assignedTo: [worker1._id],
      status: 'completed',
      priority: 'high',
      deadline: new Date('2026-02-15'),
      progressPercentage: 100,
      createdBy: manager1._id,
    });
    console.log('✓ Created task 1:', task1.title);

    const task2 = await Task.create({
      title: 'Foundation Work',
      description: 'Lay the foundation for new structures',
      project: project1._id,
      assignedTo: [worker2._id],
      status: 'in-progress',
      priority: 'high',
      deadline: new Date('2026-03-31'),
      progressPercentage: 60,
      createdBy: manager1._id,
    });
    console.log('✓ Created task 2:', task2.title);

    const task3 = await Task.create({
      title: 'Landscaping',
      description: 'Design and install landscaping elements',
      project: project1._id,
      assignedTo: [worker1._id],
      status: 'todo',
      priority: 'medium',
      deadline: new Date('2026-05-30'),
      progressPercentage: 0,
      createdBy: manager1._id,
    });
    console.log('✓ Created task 3:', task3.title);

    // Create tasks for project 2
    const task4 = await Task.create({
      title: 'Initial Safety Assessment',
      description: 'Conduct comprehensive safety assessment of the bridge',
      project: project2._id,
      assignedTo: [worker1._id],
      status: 'todo',
      priority: 'high',
      deadline: new Date('2026-03-30'),
      progressPercentage: 0,
      createdBy: manager1._id,
    });
    console.log('✓ Created task 4:', task4.title);

    console.log('\n✅ Database seeding completed successfully!');
    console.log('\nTest Accounts:');
    console.log('  Admin: admin@test.com / password123');
    console.log('  Manager: manager@test.com / password123');
    console.log('  Worker 1: worker1@test.com / password123');
    console.log('  Worker 2: worker2@test.com / password123');
    console.log('\nWorker 1 has access to both projects');
    console.log('Worker 2 has access to Downtown Plaza project only');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
};

seedDatabase();
