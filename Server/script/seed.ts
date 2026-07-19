import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv-flow'
import Company from '../src/models/Company.js'
import Employee from '../src/models/Employee.js'
import Vehicle from '../src/models/Vehicle.js'
import Ride from '../src/models/Ride.js'
import Booking from '../src/models/Booking.js'
import Wallet from '../src/models/Wallet.js'

dotenv.config()

const MONGODB_URI = process.env.DATABASE_URL || 'mongodb://localhost:27017/odooxksv'

// Locations in Gujarat with real coordinates [lng, lat]
const LOCATIONS = [
  { name: 'Satellite Road, Ahmedabad', coords: [72.5186, 23.0275] as [number, number] },
  { name: 'Odoo House, Gandhinagar', coords: [72.6369, 23.2156] as [number, number] },
  { name: 'GIFT City, Gandhinagar', coords: [72.6844, 23.1611] as [number, number] },
  { name: 'SG Highway, Ahmedabad', coords: [72.5074, 23.0489] as [number, number] },
  { name: 'KSV Campus, Gandhinagar', coords: [72.6483, 23.2294] as [number, number] },
  { name: 'Navrangpura, Ahmedabad', coords: [72.5593, 23.037] as [number, number] },
  { name: 'Prahlad Nagar, Ahmedabad', coords: [72.5097, 23.0122] as [number, number] },
  { name: 'Bodhakdev, Ahmedabad', coords: [72.5222, 23.0415] as [number, number] },
  { name: 'Kudasan, Gandhinagar', coords: [72.6335, 23.1878] as [number, number] },
  { name: 'Raysan, Gandhinagar', coords: [72.6391, 23.1664] as [number, number] },
  { name: 'Infocity, Gandhinagar', coords: [72.6288, 23.1979] as [number, number] },
  { name: 'Vastrapur, Ahmedabad', coords: [72.5293, 23.035] as [number, number] },
  { name: 'Maninagar, Ahmedabad', coords: [72.6014, 22.9972] as [number, number] },
  { name: 'Alkapuri, Vadodara', coords: [73.1712, 22.3072] as [number, number] },
  { name: 'Vesu, Surat', coords: [72.7758, 21.1444] as [number, number] },
]

const VEHICLE_MODELS = [
  { model: 'Tesla Model 3', capacity: 4, efficiency: 15 },
  { model: 'Toyota Prius Hybrid', capacity: 4, efficiency: 22 },
  { model: 'Honda City i-VTEC', capacity: 4, efficiency: 18 },
  { model: 'Hyundai Verna SX', capacity: 4, efficiency: 17 },
  { model: 'Tata Nexon EV Max', capacity: 4, efficiency: 14 },
  { model: 'Mahindra XUV700 AX7', capacity: 6, efficiency: 12 },
  { model: 'Kia Seltos GTX+', capacity: 4, efficiency: 16 },
  { model: 'Maruti Suzuki Brezza ZXi', capacity: 4, efficiency: 20 },
  { model: 'Hyundai Creta SX', capacity: 4, efficiency: 17 },
  { model: 'MG ZS EV', capacity: 4, efficiency: 15 },
  { model: 'BMW 3 Series Gran Limousine', capacity: 4, efficiency: 14 },
  { model: 'Audi A4 40 TFSI', capacity: 4, efficiency: 13 },
]

const FIRST_NAMES = [
  'Aarav', 'Ananya', 'Rohan', 'Priya', 'Aditya', 'Sneha', 'Vikram', 'Neha',
  'Karan', 'Pooja', 'Rahul', 'Ishita', 'Amit', 'Divya', 'Siddharth', 'Riya',
  'Varun', 'Kavya', 'Harsh', 'Meera', 'Gaurav', 'Tanvi', 'Deepak', 'Nisha',
  'Sanjay', 'Shruti', 'Rajesh', 'Shweta', 'Nikhil', 'Simran'
]

const LAST_NAMES = [
  'Patel', 'Shah', 'Sharma', 'Mehta', 'Verma', 'Joshi', 'Trivedi', 'Desai',
  'Gupta', 'Singh', 'Rao', 'Bhatt', 'Pandya', 'Nair', 'Kulkarni'
]

const DEPARTMENTS = ['Engineering', 'Product', 'HR', 'Marketing', 'Sales', 'Finance', 'Design']

async function seed() {
  console.log('🌱 Starting database seed process...')
  await mongoose.connect(MONGODB_URI)
  console.log(`Connected to MongoDB at ${MONGODB_URI}`)

  // 1. Create Companies
  console.log('🏢 Creating companies...')
  const companies = []

  const odooCompany = await Company.findOneAndUpdate(
    { domain: 'odoo.com' },
    {
      name: 'Odoo India',
      domain: 'odoo.com',
      address: 'Odoo House, Gandhinagar, Gujarat, India',
      industry: 'Software & Technology',
      contactInfo: '+91-79-4000-0000'
    },
    { upsert: true, new: true }
  )
  companies.push(odooCompany)

  const ksvCompany = await Company.findOneAndUpdate(
    { domain: 'ksv.ac.in' },
    {
      name: 'KSV University',
      domain: 'ksv.ac.in',
      address: 'Sector 15, Gandhinagar, Gujarat, India',
      industry: 'Education & Research',
      contactInfo: '+91-79-2324-0000'
    },
    { upsert: true, new: true }
  )
  companies.push(ksvCompany)

  const techCorp = await Company.findOneAndUpdate(
    { domain: 'techcorp.com' },
    {
      name: 'TechCorp Solutions',
      domain: 'techcorp.com',
      address: 'SG Highway, Ahmedabad, Gujarat, India',
      industry: 'IT Services',
      contactInfo: '+91-79-5000-0000'
    },
    { upsert: true, new: true }
  )
  companies.push(techCorp)

  const passwordHash = await bcrypt.hash('Password123', 10)

  // 2. Create Employees (~30 employees)
  console.log('👥 Creating employees...')
  const employees = []

  // Create primary test accounts if not existing
  const primaryAdmin = await Employee.findOneAndUpdate(
    { email: 'admin@odoo.com' },
    {
      companyId: odooCompany._id,
      name: 'Test Admin',
      email: 'admin@odoo.com',
      passwordHash,
      role: 'Admin',
      status: 'Active',
      phone: '9876543210',
      department: 'Management',
      officeLocation: 'Gandhinagar Office'
    },
    { upsert: true, new: true }
  )
  employees.push(primaryAdmin)

  const primaryDriver = await Employee.findOneAndUpdate(
    { email: 'bob.smith@odoo.com' },
    {
      companyId: odooCompany._id,
      name: 'Bob Smith',
      email: 'bob.smith@odoo.com',
      passwordHash,
      role: 'Employee',
      status: 'Active',
      phone: '9876543211',
      department: 'Engineering',
      officeLocation: 'Gandhinagar Office'
    },
    { upsert: true, new: true }
  )
  employees.push(primaryDriver)

  // Create additional 28 employees
  for (let i = 0; i < 28; i++) {
    const fn = FIRST_NAMES[i % FIRST_NAMES.length]
    const ln = LAST_NAMES[i % LAST_NAMES.length]
    const comp = companies[i % companies.length]
    const email = `${fn.toLowerCase()}.${ln.toLowerCase()}${i}@${comp.domain}`

    const emp = await Employee.findOneAndUpdate(
      { email },
      {
        companyId: comp._id,
        name: `${fn} ${ln}`,
        email,
        passwordHash,
        role: i < 3 ? 'Admin' : 'Employee',
        status: 'Active',
        phone: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
        department: DEPARTMENTS[i % DEPARTMENTS.length],
        officeLocation: `${comp.name} Main Campus`
      },
      { upsert: true, new: true }
    )
    employees.push(emp)
  }

  console.log(`Created ${employees.length} employees.`)

  // 3. Create Vehicles (~20 vehicles)
  console.log('🚗 Creating vehicles...')
  const vehicles = []

  let regCounter = 1000
  for (let i = 0; i < employees.length; i++) {
    // Give about 70% of employees a registered vehicle
    if (i % 3 !== 0) {
      const emp = employees[i]
      const vModel = VEHICLE_MODELS[i % VEHICLE_MODELS.length]
      const regNo = `GJ-01-AB-${regCounter++}`

      const veh = await Vehicle.findOneAndUpdate(
        { registrationNumber: regNo },
        {
          ownerId: emp._id,
          companyId: emp.companyId,
          model: vModel.model,
          registrationNumber: regNo,
          seatingCapacity: vModel.capacity,
          fuelEfficiency: vModel.efficiency,
          isApproved: true
        },
        { upsert: true, new: true }
      )
      vehicles.push(veh)
    }
  }

  console.log(`Created ${vehicles.length} vehicles.`)

  // 4. Create 100 Rides
  console.log('🛣️ Creating 100 rides...')
  const rides = []
  const now = new Date()

  for (let i = 0; i < 100; i++) {
    // Pick a vehicle and its driver
    const veh = vehicles[i % vehicles.length]
    const driverId = veh.ownerId

    // Pick different pickup and destination
    const pickupIdx = i % LOCATIONS.length
    let destIdx = (i + 3) % LOCATIONS.length
    if (pickupIdx === destIdx) destIdx = (destIdx + 1) % LOCATIONS.length

    const pickup = LOCATIONS[pickupIdx]
    const dest = LOCATIONS[destIdx]

    // Dates spanning past 10 days to future 15 days
    const dateOffset = (i % 25) - 10
    const travelDate = new Date(now.getTime() + dateOffset * 24 * 60 * 60 * 1000 + (i % 8) * 3600 * 1000)

    // Status logic
    let status: 'Active' | 'Completed' | 'Cancelled' = 'Active'
    if (dateOffset < 0) {
      status = i % 5 === 0 ? 'Cancelled' : 'Completed'
    }

    const seats = Math.min(veh.seatingCapacity - 1, 4)
    const fare = Math.floor(Math.random() * 40) + 30 // ₹30 - ₹70

    const ride = await Ride.create({
      driverId,
      vehicleId: veh._id,
      pickupLocation: {
        address: pickup.name,
        coordinates: pickup.coords
      },
      destination: {
        address: dest.name,
        coordinates: dest.coords
      },
      travelDateTime: travelDate,
      availableSeats: status === 'Completed' ? 0 : seats,
      totalSeats: seats,
      farePerSeat: fare,
      status,
      recurring: {
        isRecurring: i % 4 === 0,
        days: i % 4 === 0 ? ['Mon', 'Wed', 'Fri'] : []
      }
    })
    rides.push(ride)
  }

  console.log(`Successfully created ${rides.length} rides!`)

  // 5. Create ~70 Bookings for the rides
  console.log('🎟️ Creating bookings for rides...')
  let bookingCount = 0

  for (let i = 0; i < rides.length; i++) {
    const ride = rides[i]
    // 70% of rides have bookings
    if (i % 10 < 7) {
      // Pick passenger different from driver
      const potentialPassengers = employees.filter((e) => String(e._id) !== String(ride.driverId))
      const passenger = potentialPassengers[i % potentialPassengers.length]

      const bookingStatus = ride.status === 'Completed' ? 'Completed' :
                            ride.status === 'Cancelled' ? 'Cancelled' :
                            (i % 3 === 0 ? 'Pending' : 'Confirmed')

      const seatsBooked = (i % 2) + 1
      const paymentMethods: ('Cash' | 'Card' | 'UPI' | 'Wallet')[] = ['Cash', 'Card', 'UPI', 'Wallet']
      const paymentMethod = paymentMethods[i % paymentMethods.length]

      await Booking.create({
        passengerId: passenger._id,
        rideId: ride._id,
        seatsBooked,
        fareTotal: ride.farePerSeat * seatsBooked,
        paymentMethod,
        status: bookingStatus
      })
      bookingCount++
    }
  }

  console.log(`Created ${bookingCount} bookings.`)

  // 6. Create Wallets & sample transactions for all employees
  console.log('💳 Initializing employee wallets...')
  for (const emp of employees) {
    const initialBalance = Math.floor(Math.random() * 500) + 100
    await Wallet.findOneAndUpdate(
      { employeeId: emp._id },
      {
        employeeId: emp._id,
        balance: initialBalance,
        transactions: [
          {
            amount: initialBalance,
            type: 'Credit',
            description: 'Initial wallet bonus upon joining enterprise carpooling platform'
          }
        ]
      },
      { upsert: true, new: true }
    )
  }

  console.log('✨ DATABASE SEEDING COMPLETED SUCCESSFULLY!')
  console.log('----------------------------------------------------')
  console.log(`- Companies: ${companies.length}`)
  console.log(`- Employees: ${employees.length} (Passwords: Password123)`)
  console.log(`- Vehicles: ${vehicles.length}`)
  console.log(`- Rides: ${rides.length}`)
  console.log(`- Bookings: ${bookingCount}`)
  console.log('----------------------------------------------------')

  await mongoose.disconnect()
}

seed().catch((err) => {
  console.error('❌ Seeding failed with error:', err)
  mongoose.disconnect()
  process.exit(1)
})
