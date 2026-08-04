import 'dotenv/config';
import mongoose from 'mongoose';
import { User } from './models/User';
import { Project } from './models/Project';
import { Site } from './models/Site';
import { InventoryItem } from './models/InventoryItem';

const VENDORS = ['Cisco', 'HP', 'Dell', 'Lenovo', 'Huawei', 'Juniper', 'Arista', 'Fortinet'];
const OS_LIST = ['Ubuntu 22.04', 'CentOS 7', 'RHEL 9', 'Windows Server 2022', 'VMware ESXi 8', 'Debian 12', 'Rocky Linux 9'];
const CPUS = ['Intel Xeon E5-2680', 'Intel Xeon Gold 6248', 'AMD EPYC 7742', 'Intel Xeon Silver 4210'];
const RAMS = ['16GB', '32GB', '64GB', '128GB', '256GB'];
const STORAGES = ['500GB SSD', '1TB SSD', '2TB HDD', '4TB HDD', '960GB NVMe', '1.92TB NVMe'];
const STATUSES: Array<'active' | 'inactive' | 'maintenance' | 'decommissioned'> = ['active', 'active', 'active', 'active', 'active', 'inactive', 'maintenance', 'decommissioned'];

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]!;

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/inventory-app');
  console.log('Connected to MongoDB');

  // SEED_PASSWORD is required — no hardcoded fallback
  const seedPassword = process.env.SEED_PASSWORD;
  if (!seedPassword || seedPassword.length < 6) {
    console.error('❌ SEED_PASSWORD environment variable is required (min 6 chars).');
    console.error('   Example: SEED_PASSWORD=MyStr0ng!Pass npm run seed');
    process.exit(1);
  }

  // Clear
  await Promise.all([User.deleteMany(), Project.deleteMany(), Site.deleteMany(), InventoryItem.deleteMany()]);
  console.log('Cleared existing data');

  // Users
  const admin = await User.create({ email: 'admin@inventorypro.com', password: seedPassword, fullName: 'Admin User', role: 'admin' });
  for (const u of [
    { email: 'pm@inventorypro.com', password: seedPassword, fullName: 'Project Manager', role: 'project_manager' as const },
    { email: 'engineer@inventorypro.com', password: seedPassword, fullName: 'Test Engineer', role: 'engineer' as const },
    { email: 'viewer@inventorypro.com', password: seedPassword, fullName: 'Viewer User', role: 'viewer' as const },
  ]) {
    await User.create(u);
  }
  console.log('Users created (password: value of SEED_PASSWORD env)');

  // Projects
  const projects = await Project.create([
    { name: 'Turkcell Data Center', description: 'Turkcell ana veri merkezi altyapısı', owner: admin._id },
    { name: 'Network Infra', description: 'Ağ altyapısı yönetimi', owner: admin._id },
    { name: 'Cloud Migration', description: 'Bulut göç projesi', owner: admin._id },
  ]);
  console.log('Projects created');

  // Sites
  const sitesData = [
    { name: 'İstanbul DC', code: 'IST', project: projects[0]!._id },
    { name: 'Ankara DC', code: 'ANK', project: projects[0]!._id },
    { name: 'İzmir POP', code: 'IZM', project: projects[0]!._id },
    { name: 'HQ Office', code: 'HQ1', project: projects[1]!._id },
    { name: 'Cloud Zone 1', code: 'CZ1', project: projects[2]!._id },
  ];
  const sites = await Site.create(sitesData);
  console.log('Sites created');

  // Inventory items (100 items)
  const items = [];
  for (let i = 0; i < 100; i++) {
    const site = pick(sites);
    const vendor = pick(VENDORS);
    const rackNum = Math.ceil(Math.random() * 5);
    const warrantyOffset = Math.floor(Math.random() * 730 - 365);
    items.push({
      name: `${vendor.toUpperCase().slice(0, 3)}-SRV-${String(i + 1).padStart(3, '0')}`,
      ipAddress: `10.${Math.floor(Math.random() * 254)}.${Math.floor(Math.random() * 254)}.${Math.floor(Math.random() * 254) + 1}`,
      serialNumber: `SN-${vendor.slice(0, 2).toUpperCase()}${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`,
      vendor,
      model: `${vendor} ${pick(['PowerEdge', 'ProLiant', 'ThinkSystem', 'UCS', 'CloudEngine', 'EX', 'DCS', 'FortiGate'])} ${Math.floor(Math.random() * 9000 + 1000)}`,
      cpu: pick(CPUS),
      ram: pick(RAMS),
      storage: pick(STORAGES),
      os: pick(OS_LIST),
      rack: `RACK-${String.fromCharCode(65 + Math.floor((i % 20) / 5))}${String(rackNum).padStart(2, '0')}`,
      rackPosition: (i % 42) + 1,
      cabinet: `CAB-${String(Math.ceil(Math.random() * 10)).padStart(2, '0')}`,
      status: pick(STATUSES),
      warrantyDate: new Date(Date.now() + warrantyOffset * 24 * 60 * 60 * 1000),
      notes: i % 5 === 0 ? 'Bakım planı gerekli' : '',
      site: site._id,
      addedBy: admin._id,
    });
  }
  await InventoryItem.insertMany(items);
  console.log('100 inventory items created');

  await mongoose.disconnect();
  console.log('\n✅ Seed complete!');
  console.log('   Login: admin@inventorypro.com / (check SEED_PASSWORD env)');
}

seed().catch((err) => { console.error(err); process.exit(1); });
