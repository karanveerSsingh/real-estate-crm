import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import Customer, { calculateLeadScore } from '../models/Customer';
import FollowUp from '../models/FollowUp';
import SoldCustomer from '../models/SoldCustomer';
import Property from '../models/Property';
import Notification from '../models/Notification';
import Setting from '../models/Setting';
import Activity from '../models/Activity';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Please define the MONGODB_URI environment variable inside .env.local');
  process.exit(1);
}

async function seed() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGODB_URI!);
    console.log('Connected successfully!');

    // Clean existing data
    console.log('Cleaning existing database...');
    await User.deleteMany({});
    await Customer.deleteMany({});
    await FollowUp.deleteMany({});
    await SoldCustomer.deleteMany({});
    await Property.deleteMany({});
    await Notification.deleteMany({});
    await Setting.deleteMany({});
    await Activity.deleteMany({});
    console.log('Database cleaned!');

    // 1. Create Admin User
    console.log('Seeding Admin User...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = await User.create({
      name: 'Admin CRM',
      email: 'admin@crm.com',
      password: hashedPassword,
      role: 'admin',
    });
    console.log('Admin User seeded:', admin.email);

    // 2. Create Settings
    console.log('Seeding Settings...');
    const setting = await Setting.create({
      companyName: 'Apex Real Estate Solutions',
      logoUrl: '',
      officeAddress: 'Apex Tower, Tonk Road, Jaipur, Rajasthan - 302018',
      phone: '+919876543210',
      whatsApp: '+919876543210',
      email: 'contact@apexrealestate.com',
      theme: 'dark'
    });
    console.log('Settings seeded!');

    // 3. Create Properties (Inventory)
    console.log('Seeding Properties...');
    const propertiesData = [
      {
        propertyName: 'Apex Greens Phase I',
        location: 'Mansarovar Extension, Tonk Road',
        road: 'Tonk Road',
        squareYard: 150,
        facing: 'East',
        jdaApproved: true,
        rera: true,
        price: 4500000, // 45 Lakh
        status: 'Available',
        description: 'Premium JDA approved residential plots in a gated community with all basic amenities.',
        galleryImages: [],
        googleMapLink: 'https://maps.google.com',
        amenities: ['Gated Community', '24/7 Security', 'Water Pipeline', 'Black Tar Road', 'Street Lights'],
        nearbyLandmarks: ['Apex Hospital', 'Chokhi Dhani']
      },
      {
        propertyName: 'Saffron Elite Villas',
        location: 'Gokulpura, Ajmer Road',
        road: 'Ajmer Road',
        squareYard: 200,
        facing: 'West',
        jdaApproved: true,
        rera: true,
        price: 8500000, // 85 Lakh
        status: 'Available',
        description: 'Luxury duplex villas featuring modern design, modular kitchen, and smart automated systems.',
        galleryImages: [],
        googleMapLink: 'https://maps.google.com',
        amenities: ['Modular Kitchen', 'Club House', 'Swimming Pool', 'Solar Panels', 'Kids Play Area'],
        nearbyLandmarks: ['Shalby Hospital', 'Delhi Public School']
      },
      {
        propertyName: 'Royal residency plots',
        location: 'Ring Road Crossing, Diggi Road',
        road: 'Diggi Road',
        squareYard: 120,
        facing: 'North',
        jdaApproved: true,
        rera: false,
        price: 2400000, // 24 Lakh
        status: 'Available',
        description: 'Affordable plots with high appreciation potential near Jaipur Outer Ring Road.',
        galleryImages: [],
        googleMapLink: 'https://maps.google.com',
        amenities: ['Water Connection', 'Park', 'Electricity Grid'],
        nearbyLandmarks: ['Ring Road toll plaza']
      },
      {
        propertyName: 'Delhi Road Industrial Enclave',
        location: 'Kukas, Delhi Road',
        road: 'Delhi Road',
        squareYard: 500,
        facing: 'South',
        jdaApproved: true,
        rera: true,
        price: 15000000, // 1.5 Crore
        status: 'Available',
        description: 'Prime commercial/industrial land on the main highway road suitable for warehouses and factories.',
        galleryImages: [],
        googleMapLink: 'https://maps.google.com',
        amenities: ['Wide Highway Access', 'Heavy Electricity Line', 'Drainage System'],
        nearbyLandmarks: ['Kukas Industrial Area']
      },
      {
        propertyName: 'Shree Ram Vihar',
        location: 'Jagatpura Extension, Agra Road',
        road: 'Agra Road',
        squareYard: 100,
        facing: 'East',
        jdaApproved: false,
        rera: false,
        price: 1800000, // 18 Lakh
        status: 'Sold',
        description: 'Budget-friendly residential society on Agra Road with good connectivity.',
        galleryImages: [],
        googleMapLink: 'https://maps.google.com',
        amenities: ['Street Lights', 'Water Supply'],
        nearbyLandmarks: ['Luniawas Bus Stand']
      },
      {
        propertyName: 'Prestige Heights',
        location: 'Vidhyadhar Nagar, Ajmer Road',
        road: 'Ajmer Road',
        squareYard: 180,
        facing: 'South-East',
        jdaApproved: true,
        rera: true,
        price: 5500000, // 55 Lakh
        status: 'Booked',
        description: 'Premium apartment unit, highly suitable for residential families and investors alike.',
        galleryImages: [],
        googleMapLink: 'https://maps.google.com',
        amenities: ['Gym', 'Elevator', 'Intercom', 'Power Backup'],
        nearbyLandmarks: ['Vidhyadhar Park']
      }
    ];

    const properties = await Property.create(propertiesData);
    console.log(`Seeded ${properties.length} Properties.`);

    // 4. Create Customers (Leads)
    console.log('Seeding Customers...');
    const customersData = [
      {
        fullName: 'Rajesh Sharma',
        mobileNumber: '9829012345',
        whatsAppNumber: '9829012345',
        purpose: 'Residential',
        budget: '50 Lakh',
        preferredLocations: ['Ajmer Road', 'Tonk Road'],
        leadSource: 'Facebook',
        leadStatus: 'Interested',
        notes: 'Client looking for a 3 BHK duplex villa or a big plot to build a house immediately.',
        requirement: 'Duplex villa, JDA approved, east facing preferred.'
      },
      {
        fullName: 'Amit Verma',
        mobileNumber: '9414098765',
        whatsAppNumber: '9414098765',
        purpose: 'Investment',
        budget: '20 Lakh',
        preferredLocations: ['Agra Road', 'Diggi Road'],
        leadSource: 'Magicbricks',
        leadStatus: 'New',
        notes: 'Wants to invest in a developing area. High return options preferred.',
        requirement: 'Small plot, low maintenance, high growth.'
      },
      {
        fullName: 'Priya Patel',
        mobileNumber: '9928011223',
        whatsAppNumber: '9928011223',
        purpose: 'Residential',
        budget: '1 Crore',
        preferredLocations: ['Tonk Road', 'Delhi Road'],
        leadSource: 'Instagram',
        leadStatus: 'Site Visit',
        notes: 'Extremely hot lead. Visited Tonk Road project, liked the 150 sqyd plot. Negotiation in progress.',
        requirement: 'Premium layout, security and gated society is a must.'
      },
      {
        fullName: 'Vikram Singh',
        mobileNumber: '8877665544',
        whatsAppNumber: '8877665544',
        purpose: 'Investment',
        budget: '1 Crore',
        preferredLocations: ['Delhi Road'],
        leadSource: 'Walk-in',
        leadStatus: 'Sold',
        notes: 'Closed the deal for Kukas industrial land. Document collection and registry pending.',
        requirement: 'Industrial plot with main highway connectivity.'
      },
      {
        fullName: 'Sanjay Gupta',
        mobileNumber: '9001234567',
        whatsAppNumber: '9001234567',
        purpose: 'Residential',
        budget: '30 Lakh',
        preferredLocations: ['Diggi Road', 'Agra Road'],
        leadSource: 'Cold Calling',
        leadStatus: 'Follow-up',
        notes: 'Called yesterday. Asked to call back on Friday at 4 PM to discuss budget options.',
        requirement: 'JDA approved plot within 30 Lakhs.'
      },
      {
        fullName: 'Deepika Rao',
        mobileNumber: '9116099887',
        whatsAppNumber: '9116099887',
        purpose: 'Investment',
        budget: '10 Lakh',
        preferredLocations: ['Diggi Road'],
        leadSource: 'Website',
        leadStatus: 'Lost',
        notes: 'Low budget, Diggi Road is too far for her. Lost lead.',
        requirement: 'Agricultural land / low price plot.'
      }
    ];

    const customers = [];
    for (const c of customersData) {
      // Create manually to invoke pre-save hook and get correct leadScore
      const customer = new Customer(c);
      await customer.save();
      customers.push(customer);
    }
    console.log(`Seeded ${customers.length} Customers.`);

    // Find customers by name to assign follow-ups and transactions
    const rajesh = customers.find(c => c.fullName === 'Rajesh Sharma');
    const amit = customers.find(c => c.fullName === 'Amit Verma');
    const priya = customers.find(c => c.fullName === 'Priya Patel');
    const vikram = customers.find(c => c.fullName === 'Vikram Singh');
    const sanjay = customers.find(c => c.fullName === 'Sanjay Gupta');

    // 5. Create FollowUps
    console.log('Seeding Follow-ups...');
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const followUpsData = [
      {
        customerId: rajesh!._id,
        date: today,
        time: '11:00',
        title: 'Call Rajesh for Project Brochure',
        remark: 'Send the villa layout brochure over WhatsApp and confirm requirements.',
        priority: 'High',
        status: 'Pending'
      },
      {
        customerId: priya!._id,
        date: today,
        time: '16:00',
        title: 'Discuss pricing with Priya',
        remark: 'Negotiate the down payment details for the Tonk Road plot.',
        priority: 'High',
        status: 'Pending'
      },
      {
        customerId: sanjay!._id,
        date: tomorrow,
        time: '14:30',
        title: 'Follow-up Call: Sanjay',
        remark: 'Check if his family has approved the Diggi Road site plan.',
        priority: 'Medium',
        status: 'Pending'
      },
      {
        customerId: amit!._id,
        date: yesterday,
        time: '12:00',
        title: 'Initial contact: Amit Verma',
        remark: 'Missed this call. Need to follow up ASAP. Urgent.',
        priority: 'High',
        status: 'Pending' // Overdue / Missed
      },
      {
        customerId: rajesh!._id,
        date: yesterday,
        time: '10:00',
        title: 'Introduce Agency',
        remark: 'Shared standard intro, client requested options on email.',
        priority: 'Low',
        status: 'Completed'
      },
      {
        customerId: priya!._id,
        date: nextWeek,
        time: '11:00',
        title: 'Site Visit: Priya Patel',
        remark: 'Arrange a cab for site visit of Ajmer Road project.',
        priority: 'High',
        status: 'Pending'
      }
    ];

    const followUps = await FollowUp.create(followUpsData);
    console.log(`Seeded ${followUps.length} Follow-ups.`);

    // 6. Create Sold Customer Transaction
    console.log('Seeding Sold Customer details...');
    const soldCustomer = await SoldCustomer.create({
      customerId: vikram!._id,
      customerName: vikram!.fullName,
      mobile: vikram!.mobileNumber,
      projectName: 'Delhi Road Industrial Enclave',
      location: 'Kukas, Delhi Road',
      squareYard: 500,
      ratePerSquareYard: 30000,
      totalAmount: 15000000,
      bookingAmount: 2000000,
      downPayment: 3000000,
      loanAmount: 8000000,
      remainingAmount: 2000000,
      registryStatus: 'In Progress',
      fileProcessingStatus: 'Submitted',
      agreementStatus: 'Signed',
      paymentStatus: 'Partial',
      bookingDate: yesterday,
      registryDate: nextWeek,
      salesExecutive: 'Rohan Mehta',
      remarks: 'Registry date scheduled. Bank loan sanctioned from HDFC.',
      documents: [
        {
          name: 'Aadhaar Card Vikram.pdf',
          url: '/uploads/aadhaar_vikram.pdf',
          fileType: 'Aadhaar'
        },
        {
          name: 'Booking Receipt 20 Lakh.pdf',
          url: '/uploads/receipt_20l.pdf',
          fileType: 'Receipt'
        }
      ]
    });
    console.log('Sold Customer details seeded:', soldCustomer.customerName);

    // Update Property status to Sold for Delhi Road Industrial Enclave
    await Property.updateOne(
      { propertyName: 'Delhi Road Industrial Enclave' },
      { $set: { status: 'Sold' } }
    );
    console.log('Updated Delhi Road Industrial Enclave status to Sold.');

    // Update Property status to Booked for Prestige Heights
    await Property.updateOne(
      { propertyName: 'Prestige Heights' },
      { $set: { status: 'Booked' } }
    );
    console.log('Updated Prestige Heights status to Booked.');

    // 7. Create Activities (Timeline logs)
    console.log('Seeding Activities...');
    const activitiesData = [
      {
        customerId: rajesh!._id,
        type: 'Lead Created',
        description: 'Lead imported from Facebook Campaign.',
        timestamp: yesterday
      },
      {
        customerId: rajesh!._id,
        type: 'Called',
        description: 'Introduction call done. Customer expressed interest in Tonk Road.',
        timestamp: yesterday
      },
      {
        customerId: rajesh!._id,
        type: 'Follow-up Done',
        description: 'Shared pricing structure and layout documents via WhatsApp.',
        timestamp: today
      },
      {
        customerId: amit!._id,
        type: 'Lead Created',
        description: 'New inquiry received via Magicbricks portal.',
        timestamp: yesterday
      },
      {
        customerId: priya!._id,
        type: 'Lead Created',
        description: 'Lead captured via Instagram Ads form.',
        timestamp: yesterday
      },
      {
        customerId: priya!._id,
        type: 'Site Visit',
        description: 'Arranged site visit. Customer visited Tonk Road project and liked the landscape.',
        timestamp: today
      },
      {
        customerId: vikram!._id,
        type: 'Lead Created',
        description: 'Walk-in customer at Tonk Road corporate office.',
        timestamp: yesterday
      },
      {
        customerId: vikram!._id,
        type: 'Booked',
        description: 'Paid 20 Lakh advance booking amount via bank transfer.',
        timestamp: yesterday
      },
      {
        customerId: vikram!._id,
        type: 'Sold',
        description: 'Signed full sale agreement document. Moved customer to Sold Module.',
        timestamp: today
      }
    ];

    const activities = await Activity.create(activitiesData);
    console.log(`Seeded ${activities.length} Activities.`);

    // 8. Create Notifications
    console.log('Seeding Notifications...');
    const notificationsData = [
      {
        title: 'Overdue Follow-up Reminder',
        message: `Follow-up with ${amit!.fullName} was scheduled for yesterday. Check notes and call immediately.`,
        type: 'FollowUp',
        read: false,
        customerId: amit!._id,
        date: yesterday
      },
      {
        title: 'Upcoming Site Visit',
        message: `${priya!.fullName} has a site visit scheduled for today at 4:00 PM.`,
        type: 'FollowUp',
        read: false,
        customerId: priya!._id,
        date: today
      },
      {
        title: 'New Booking Logged',
        message: `${vikram!.fullName} booked Delhi Road Industrial Enclave for 1.5 Cr.`,
        type: 'Booking',
        read: false,
        customerId: vikram!._id,
        date: yesterday
      },
      {
        title: 'Registry Deadline Pending',
        message: `Registry files for ${vikram!.fullName} must be processed by next week.`,
        type: 'Registry',
        read: false,
        customerId: vikram!._id,
        date: today
      }
    ];

    const notifications = await Notification.create(notificationsData);
    console.log(`Seeded ${notifications.length} Notifications.`);

    console.log('Seeding process completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding process failed:', error);
    process.exit(1);
  }
}

seed();
