/* ============================================================
   SEED SCRIPT
   Optional one-time setup that fills the database with starter
   content (admin account, about info, skills, and sample
   projects). Run it with:
       npm run seed
   It does not delete anything you already have for collections
   that are not empty — use it safely on a fresh database too.
============================================================ */
const path = require('path');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config({ path: path.join(__dirname, '.env') });

const connectDB = require('./config/db');
const Admin = require('./models/Admin');
const About = require('./models/About');
const Skill = require('./models/Skill');
const Project = require('./models/Project');

async function seed() {
  await connectDB();

  console.log('🌱 Seeding database...');

  /* --- 1. Admin account from .env --- */
  const adminCount = await Admin.countDocuments();
  if (adminCount === 0) {
    const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
    await Admin.create({ username: process.env.ADMIN_USERNAME, passwordHash });
    console.log(`  ✔ Created admin user "${process.env.ADMIN_USERNAME}"`);
  } else {
    console.log('  — Admin account already exists, skipped.');
  }

  /* --- 2. About document --- */
  const aboutCount = await About.countDocuments();
  if (aboutCount === 0) {
    await About.create({
      greeting: "Hi, I'm",
      name: 'Saba Zulfiqar',
      headline: 'MERN Stack Developer | Building Modern Web Applications | React.js Enthusiast',
      description:
        'I craft fast, scalable, and beautiful full-stack applications with the MERN stack. Turning ideas into digital products.',
      bioTitle: "A curious mind, a builder's heart.",
      bioParagraphs: [
        "I'm Saba Zulfiqar — a BS Sociology student who found a passion for technology and transitioned into the world of web development.",
        'What started as curiosity became a career path: I build full-stack applications using MongoDB, Express.js, React.js, and Node.js — solving real problems with clean code.',
        'With a sociology background I bring an empathy-first perspective to product development, understanding people and how technology shapes human interaction.'
      ],
      contact: {
        email: 'sabazulfiqar926@gmail.com',
        phone: '03075834975',
        github: 'https://github.com/saba-zulfiqar',
        linkedin: 'https://www.linkedin.com/in/saba-rana-015059356/',
        location: 'Pakistan'
      }
    });
    console.log('  ✔ Created About document');
  } else {
    console.log('  — About document already exists, skipped.');
  }

  /* --- 3. Skills --- */
  const skillCount = await Skill.countDocuments();
  if (skillCount === 0) {
    const skills = [
      { name: 'HTML', icon: 'fa-brands fa-html5', percent: 95 },
      { name: 'CSS', icon: 'fa-brands fa-css3-alt', percent: 90 },
      { name: 'JavaScript', icon: 'fa-brands fa-js-square', percent: 85 },
      { name: 'React.js', icon: 'fa-brands fa-react', percent: 80 },
      { name: 'Node.js', icon: 'fa-brands fa-node-js', percent: 75 },
      { name: 'Express.js', icon: 'fa-solid fa-server', percent: 75 },
      { name: 'MongoDB', icon: 'fa-solid fa-database', percent: 70 },
      { name: 'Git / GitHub', icon: 'fa-brands fa-git-alt', percent: 80 }
    ];
    await Skill.insertMany(skills);
    console.log('  ✔ Created', skills.length, 'default skills');
  } else {
    console.log('  — Skills already exist, skipped.');
  }

  /* --- 4. Sample projects --- */
  const projectCount = await Project.countDocuments();
  if (projectCount === 0) {
    const projects = [
      {
        title: 'Portfolio Website with Admin Dashboard',
        description:
          'This very site! A full-stack portfolio platform where the owner logs into a secure admin dashboard to update projects, skills, and bio — built with the MERN stack.',
        techStack: ['HTML', 'CSS', 'JavaScript', 'Node.js', 'Express.js', 'MongoDB'],
        liveLink: '/',
        githubLink: 'https://github.com/saba-zulfiqar'
      },
      {
        title: 'TaskFlow — Task Management App',
        description:
          'A Kanban-style task management application with drag-and-drop boards, authentication, and team collaboration features.',
        techStack: ['React.js', 'Node.js', 'Socket.io', 'MongoDB'],
        liveLink: '',
        githubLink: 'https://github.com/saba-zulfiqar'
      },
      {
        title: 'ShopSphere — E-Commerce Store',
        description:
          'A full-fledged e-commerce platform featuring product catalog, cart, payment integration, order management, and an admin panel.',
        techStack: ['React.js', 'Redux', 'Express.js', 'MongoDB'],
        liveLink: '',
        githubLink: 'https://github.com/saba-zulfiqar'
      }
    ];
    await Project.insertMany(projects);
    console.log('  ✔ Created', projects.length, 'sample projects');
  } else {
    console.log('  — Projects already exist, skipped.');
  }

  console.log('✅ Seeding complete!');
  process.exit(0);
}

seed().catch((error) => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});