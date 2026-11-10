// ===== WHITE-BALL DATA (ODI, T20I, One-Day Cup, BBL) =====
// White-ball attributes: bat.power (boundary and six hitting), bat.finish (death overs and rotating strike under pressure)
// bowl.death (yorkers and death bowling), bowl.vars (slower balls, cutters, variations, mystery)
// x.wb: { power, finish, death, vars } overrides. x.wbOnly: rarely plays first-class. x.intlRet: retired from internationals (club cricket only).

// ---------- White-ball specialists and club players not already in the pools ----------
const W = (name, age, role, bat, agg, tilt, bowl, pot, x) => { const p = Q(name, age, role, bat, agg, tilt, bowl, pot, x); p.wb0 = x && x.wb; if (x && (x.wbOnly || x.intlRet)) p.wbOnly = true; if (x && x.intlRet) p.intl = 'none'; if (p.wbOnly && pot) p.potWB = pot; return p; };
const WB_EXTRA = {
  AUS: [
    W('Matt Short', 30, 'AR', 70, 88, 0, 'OB 64', null, { st: 'SA', wbOnly: true, wb: { power: 88, finish: 76 } }),
    W('Tim David', 30, 'BAT', 66, 95, 0, 'OB 40', null, { wbOnly: true, wb: { power: 96, finish: 93 } }),
    W('Glenn Maxwell', 38, 'AR', 68, 94, -1, 'OB 66', null, { st: 'VIC', wbOnly: true, wb: { power: 92, finish: 88, vars: 74 } }),
    W('Marcus Stoinis', 37, 'AR', 68, 88, 1, 'RM 64', null, { st: 'WA', wbOnly: true, wb: { power: 90, finish: 86, death: 70, vars: 70 } }),
    W('Ashton Agar', 33, 'AR', 62, 70, 0, 'SLA 70', null, { st: 'WA', h: 'L', wbOnly: true, wb: { vars: 74 } }),
    W('Jason Behrendorff', 36, 'BOWL', 30, 45, 0, 'LFM 74', null, { st: 'WA', h: 'L', wbOnly: true, wb: { death: 72, vars: 74 }, swing: 84 }),
    W('Daniel Sams', 34, 'AR', 56, 85, 0, 'LFM 70', null, { st: 'NSW', h: 'L', wbOnly: true, wb: { power: 86, death: 78, vars: 80 } }),
    W('Chris Green', 33, 'AR', 56, 75, 0, 'OB 70', null, { st: 'NSW', wbOnly: true, wb: { vars: 76 } }),
    W('Peter Siddle', 42, 'BOWL', 40, 45, 0, 'RFM 66', null, { st: 'VIC', wbOnly: true, wb: { vars: 74 } }),
    W('Usman Khawaja', 39, 'BAT', 76, 55, 0, null, null, { st: 'QLD', h: 'L', wbOnly: true, intlRet: true, wb: { power: 66, finish: 72 } }),
    W('David Warner', 40, 'BAT', 73, 90, 1, null, null, { st: 'NSW', h: 'L', wbOnly: true, intlRet: true, wb: { power: 86, finish: 76 } }),
    W('Max Bryant', 27, 'BAT', 60, 88, 0, null, 75, { st: 'QLD', wbOnly: true, wb: { power: 86 } }),
    W('Thomas Kelly', 23, 'BOWL', 34, 50, 0, 'RFM 62', 77, { st: 'SA', wb: { death: 66 } }),
    W('Nick Hobson', 32, 'BAT', 60, 82, 0, null, null, { st: 'WA', wbOnly: true, wb: { power: 84, finish: 82 } }),
    W('Josh Brown', 32, 'BAT', 56, 92, 0, null, null, { st: 'QLD', wbOnly: true, wb: { power: 88 } }),
    W('Callum Stow', 21, 'BAT', 56, 80, 0, null, 77, { st: 'VIC', wbOnly: true, wb: { power: 80 } }),
    W('Jafer Chohan', 22, 'BOWL', 32, 50, 0, 'LB 60', 78, { st: 'NSW', wbOnly: true, wb: { vars: 74 } }),
    W('Calvin Harrison', 28, 'BOWL', 40, 60, 0, 'LB 62', null, { st: 'WA', wbOnly: true, wb: { vars: 70 } }),
    W('Albert Esterhuysen', 20, 'BOWL', 30, 45, 0, 'RF 58', 80, { st: 'WA' }),
    W('Michael Archer', 24, 'BAT', 56, 75, 0, null, 74, { st: 'VIC', wbOnly: true }),
  ],
  ENG: [
    W('Jos Buttler', 36, 'WK', 74, 92, 0, null, null, { keep: 82, wbOnly: true, wb: { power: 93, finish: 92 } }),
    W('Phil Salt', 30, 'BAT', 66, 95, 0, null, null, { wbOnly: true, wb: { power: 92, finish: 78 } }),
    W('Liam Livingstone', 33, 'AR', 66, 92, -1, 'LB 60', null, { wbOnly: true, wb: { power: 94, finish: 86 } }),
    W('Adil Rashid', 38, 'BOWL', 46, 60, 0, 'LB 82', null, { wbOnly: true, wb: { vars: 88 }, acc: 2 }),
    W('Will Jacks', 28, 'AR', 68, 88, -1, 'OB 66', null, { wbOnly: true, wb: { power: 88, finish: 80 } }),
    W('Sam Curran', 28, 'AR', 64, 80, 0, 'LFM 72', null, { h: 'L', wbOnly: true, wb: { power: 80, finish: 82, death: 80, vars: 82 } }),
    W('Tom Banton', 28, 'WK', 66, 88, 0, null, 78, { wbOnly: true, keep: 76, wb: { power: 86 } }),
    W('Saqib Mahmood', 29, 'BOWL', 36, 50, 0, 'RF 76', null, { wbOnly: true, wb: { death: 76, vars: 78 } }),
    W('Jamie Overton', 32, 'AR', 60, 85, 0, 'RF 76', null, { wbOnly: true, wb: { power: 86, finish: 80, death: 76 } }),
    W('Luke Wood', 31, 'BOWL', 34, 55, 0, 'LF 72', null, { h: 'L', wbOnly: true, wb: { death: 74 } }),
    W('Ben Stokes', 35, 'AR', 72, 80, 0, 'RFM 72', null, { h: 'L', intlRet: true, wb: { power: 86, finish: 88 } }),
    W('Jonny Bairstow', 37, 'WK', 70, 88, 0, null, null, { intlRet: true, keep: 76, wb: { power: 86 } }),
    W('Tom Curran', 31, 'AR', 56, 75, 0, 'RFM 70', null, { wbOnly: true, intlRet: true, wb: { death: 80, vars: 84 } }),
    W('Chris Jordan', 38, 'BOWL', 50, 70, 0, 'RFM 70', null, { intlRet: true, wb: { death: 82, vars: 80 }, field: 90 }),
    W('Sam Billings', 35, 'WK', 62, 82, 0, null, null, { intlRet: true, keep: 78, wb: { finish: 82 } }),
    W('Craig Overton', 32, 'BOWL', 56, 60, 0, 'RFM 72', null, { intlRet: true }),
    W('Aneurin Donald', 29, 'BAT', 62, 88, 0, null, null, { intlRet: true, wb: { power: 84 } }),
  ],
  IND: [
    W('Rohit Sharma', 39, 'BAT', 80, 88, 0, null, null, { wbOnly: true, wb: { power: 92, finish: 78 } }),
    W('Virat Kohli', 38, 'BAT', 85, 72, 0, null, null, { wbOnly: true, wb: { power: 80, finish: 94 } }),
    W('Suryakumar Yadav', 36, 'BAT', 68, 94, 0, null, null, { wbOnly: true, wb: { power: 92, finish: 86 } }),
    W('Abhishek Sharma', 26, 'AR', 68, 97, 0, 'SLA 58', 92, { h: 'L', wbOnly: true, wb: { power: 96, finish: 80 } }),
    W('Ishan Kishan', 28, 'WK', 68, 92, 0, null, null, { h: 'L', wbOnly: true, keep: 78, wb: { power: 90, finish: 80 } }),
    W('Sanju Samson', 32, 'WK', 68, 90, 0, null, null, { wbOnly: true, keep: 78, wb: { power: 90 } }),
    W('Hardik Pandya', 33, 'AR', 66, 88, 0, 'RFM 74', null, { wbOnly: true, wb: { power: 90, finish: 90, death: 76, vars: 80 } }),
    W('Axar Patel', 32, 'AR', 64, 78, 0, 'SLA 76', null, { h: 'L', wbOnly: true, wb: { power: 80, vars: 80 }, acc: 6 }),
    W('Shivam Dube', 33, 'AR', 62, 90, 0, 'RM 58', null, { h: 'L', wbOnly: true, wb: { power: 92 } }),
    W('Arshdeep Singh', 27, 'BOWL', 30, 45, 0, 'LFM 76', null, { h: 'L', wbOnly: true, wb: { death: 88, vars: 82 }, swing: 84 }),
    W('Varun Chakravarthy', 35, 'BOWL', 24, 40, 0, 'LB 80', null, { wbOnly: true, wb: { vars: 95 }, acc: 6 }),
    W('Tilak Varma', 24, 'BAT', 70, 86, 0, 'OB 45', 88, { h: 'L', wbOnly: true, wb: { power: 86, finish: 86 } }),
    W('Rinku Singh', 29, 'BAT', 64, 88, 0, null, null, { h: 'L', wbOnly: true, wb: { power: 88, finish: 92 } }),
    W('Shreyas Iyer', 32, 'BAT', 74, 80, -1, null, null, { wbOnly: true, wb: { power: 82, finish: 86 } }),
    W('Harshit Rana', 25, 'BOWL', 42, 60, 0, 'RF 72', 82, { wbOnly: true, wb: { death: 72 } }),
  ],
  SA: [
    W('Quinton de Kock', 33, 'WK', 72, 90, 0, null, null, { h: 'L', wbOnly: true, keep: 80, wb: { power: 88 } }),
    W('David Miller', 37, 'BAT', 68, 88, 0, null, null, { h: 'L', wbOnly: true, wb: { power: 90, finish: 92 } }),
    W('Dewald Brevis', 23, 'BAT', 68, 95, 0, 'LB 45', 90, { wbOnly: true, wb: { power: 95, finish: 84 } }),
    W('Reeza Hendricks', 37, 'BAT', 68, 76, 0, null, null, { wbOnly: true, wb: { power: 78 } }),
    W('Tabraiz Shamsi', 36, 'BOWL', 24, 40, 0, 'SLA 74', null, { h: 'L', wbOnly: true, wb: { vars: 88 } }),
    W('Kwena Maphaka', 20, 'BOWL', 30, 50, 0, 'LF 72', 89, { h: 'L', wb: { death: 74, vars: 76 } }),
    W('Tony de Zorzi', 29, 'BAT', 72, 60, 0, null, null, { h: 'L', wbOnly: true }),
  ],
  NZ: [
    W('Finn Allen', 27, 'BAT', 62, 97, 0, null, 82, { wbOnly: true, wb: { power: 95 } }),
    W('Mark Chapman', 32, 'BAT', 66, 86, 0, null, null, { h: 'L', wbOnly: true, wb: { power: 86, finish: 86 } }),
    W('Michael Bracewell', 35, 'AR', 66, 82, 0, 'OB 72', null, { h: 'L', wbOnly: true, wb: { power: 84, finish: 86, vars: 76 } }),
    W('Tim Seifert', 32, 'WK', 64, 90, 0, null, null, { wbOnly: true, keep: 78, wb: { power: 88 } }),
    W('Lockie Ferguson', 35, 'BOWL', 34, 55, 0, 'RF 80', null, { wbOnly: true, wb: { death: 82, vars: 84 }, prone: 1.4 }),
    W('Trent Boult', 37, 'BOWL', 40, 55, 0, 'LFM 80', null, { h: 'L', wbOnly: true, intlRet: true, wb: { death: 82, vars: 78 }, swing: 92 }),
    W('Ish Sodhi', 34, 'BOWL', 36, 55, 0, 'LB 74', null, { wbOnly: true, wb: { vars: 82 } }),
    W('Bevon Jacobs', 24, 'BAT', 60, 88, 0, null, 80, { wbOnly: true, wb: { power: 86, finish: 82 } }),
    W('Tim Robinson', 24, 'BAT', 62, 86, 0, null, 79, { wbOnly: true, wb: { power: 84 } }),
    W('Jimmy Neesham', 36, 'AR', 62, 84, 0, 'RM 64', null, { h: 'L', wbOnly: true, wb: { power: 86, finish: 86 } }),
  ],
  PAK: [
    W('Fakhar Zaman', 36, 'BAT', 68, 88, 0, null, null, { h: 'L', wbOnly: true, wb: { power: 88 } }),
    W('Saim Ayub', 24, 'AR', 68, 88, 0, 'OB 56', 87, { h: 'L', wbOnly: true, wb: { power: 88 } }),
    W('Sahibzada Farhan', 30, 'BAT', 66, 90, 0, null, null, { wbOnly: true, wb: { power: 90, finish: 80 } }),
    W('Haris Rauf', 33, 'BOWL', 34, 55, 0, 'RF 78', null, { wbOnly: true, wb: { death: 80, vars: 80 } }),
    W('Naseem Shah', 23, 'BOWL', 40, 60, 0, 'RF 78', 86, { wb: { death: 74 }, prone: 1.4 }),
    W('Shadab Khan', 28, 'AR', 60, 82, 0, 'LB 72', null, { wbOnly: true, wb: { power: 82, vars: 80 }, field: 90 }),
    W('Mohammad Nawaz', 32, 'AR', 60, 76, 0, 'SLA 72', null, { h: 'L', wbOnly: true, wb: { vars: 76 } }),
    W('Hasan Nawaz', 24, 'BAT', 62, 92, 0, null, 82, { wbOnly: true, wb: { power: 90 } }),
  ],
  SL: [
    W('Charith Asalanka', 29, 'BAT', 70, 80, -1, 'OB 50', null, { h: 'L', wbOnly: true, wb: { power: 82, finish: 86 } }),
    W('Wanindu Hasaranga', 29, 'AR', 56, 82, 0, 'LB 80', null, { wbOnly: true, wb: { power: 80, vars: 90 } }),
    W('Maheesh Theekshana', 26, 'BOWL', 40, 55, 0, 'OB 78', 84, { wbOnly: true, wb: { vars: 90 }, acc: 6 }),
    W('Matheesha Pathirana', 23, 'BOWL', 22, 40, 0, 'RF 74', 87, { wbOnly: true, wb: { death: 88, vars: 84 }, acc: -4, prone: 1.4 }),
    W('Kusal Perera', 36, 'WK', 64, 90, 0, null, null, { h: 'L', wbOnly: true, keep: 74, wb: { power: 86 } }),
    W('Dunith Wellalage', 23, 'AR', 58, 66, 0, 'SLA 70', 85, { h: 'L', wbOnly: true, wb: { vars: 76 } }),
    W('Nuwan Thushara', 32, 'BOWL', 24, 40, 0, 'RFM 72', null, { wbOnly: true, wb: { death: 80, vars: 78 } }),
  ],
  WI: [
    W('Rovman Powell', 33, 'BAT', 62, 94, 0, 'RM 50', null, { wbOnly: true, wb: { power: 95, finish: 86 } }),
    W('Shimron Hetmyer', 29, 'BAT', 64, 92, 0, null, null, { h: 'L', wbOnly: true, wb: { power: 92, finish: 86 } }),
    W('Sherfane Rutherford', 28, 'BAT', 62, 92, 0, 'RM 52', 80, { h: 'L', wbOnly: true, wb: { power: 92, finish: 84 } }),
    W('Gudakesh Motie', 31, 'BOWL', 46, 60, 0, 'SLA 74', null, { h: 'L', wbOnly: true, wb: { vars: 78 }, acc: 4 }),
    W('Akeal Hosein', 33, 'BOWL', 44, 60, 0, 'SLA 74', null, { h: 'L', wbOnly: true, wb: { vars: 80 }, acc: 6 }),
    W('Romario Shepherd', 31, 'AR', 56, 90, 0, 'RFM 68', null, { wbOnly: true, wb: { power: 92, death: 72 } }),
    W('Jason Holder', 35, 'AR', 64, 72, 0, 'RFM 76', null, { wb: { death: 76, vars: 78 } }),
    W('Evin Lewis', 34, 'BAT', 62, 92, 0, null, null, { h: 'L', wbOnly: true, wb: { power: 92 } }),
  ],
  BAN: [
    W('Towhid Hridoy', 26, 'BAT', 68, 80, 0, null, 82, { wbOnly: true, wb: { power: 80, finish: 82 } }),
    W('Tanzid Hasan', 26, 'BAT', 64, 90, 0, null, 80, { h: 'L', wbOnly: true, wb: { power: 86 } }),
    W('Mustafizur Rahman', 31, 'BOWL', 24, 40, 0, 'LFM 74', null, { h: 'L', wbOnly: true, wb: { death: 86, vars: 92 } }),
    W('Rishad Hossain', 24, 'BOWL', 48, 70, 0, 'LB 70', 82, { wbOnly: true, wb: { vars: 80 } }),
    W('Mahedi Hasan', 32, 'AR', 52, 70, 0, 'OB 70', null, { wbOnly: true, wb: { vars: 74 }, acc: 5 }),
    W('Tanzim Hasan Sakib', 23, 'BOWL', 34, 55, 0, 'RFM 70', 81, { wbOnly: true, wb: { death: 74 } }),
  ],
  AFG: [
    W('Rahmanullah Gurbaz', 25, 'WK', 64, 92, 0, null, 85, { wbOnly: true, keep: 76, wb: { power: 92 } }),
    W('Azmatullah Omarzai', 26, 'AR', 64, 85, 0, 'RFM 74', 86, { wbOnly: true, wb: { power: 88, finish: 84, death: 76 } }),
    W('Mohammad Nabi', 41, 'AR', 60, 80, 0, 'OB 72', null, { wbOnly: true, wb: { power: 84, vars: 80 }, acc: 5 }),
    W('Noor Ahmad', 22, 'BOWL', 24, 40, 0, 'SLA 76', 89, { h: 'L', wbOnly: true, wb: { vars: 90 } }),
    W('Fazalhaq Farooqi', 26, 'BOWL', 22, 40, 0, 'LFM 76', null, { h: 'L', wbOnly: true, wb: { death: 76, vars: 76 }, swing: 86 }),
    W('Mujeeb Ur Rahman', 25, 'BOWL', 30, 50, 0, 'OB 74', null, { wbOnly: true, wb: { vars: 90 }, acc: 6 }),
    W('Sediqullah Atal', 25, 'BAT', 64, 84, 0, null, 80, { h: 'L', wbOnly: true, wb: { power: 84 } }),
    W('Naveen-ul-Haq', 27, 'BOWL', 34, 55, 0, 'RFM 72', null, { wbOnly: true, wb: { death: 84, vars: 86 } }),
  ],
  ZIM: [
    W('Ryan Burl', 32, 'AR', 60, 85, 0, 'LB 60', null, { h: 'L', wbOnly: true, wb: { power: 86, finish: 84 } }),
    W('Tadiwanashe Marumani', 24, 'WK', 58, 85, 0, null, 77, { h: 'L', wbOnly: true, keep: 72, wb: { power: 82 } }),
  ],
  IRE: [
    W('George Dockrell', 34, 'AR', 60, 70, 0, 'SLA 66', null, { h: 'L', wbOnly: true, wb: { vars: 72 } }),
    W('Gareth Delany', 29, 'AR', 58, 85, 0, 'LB 60', null, { wbOnly: true, wb: { power: 84 } }),
  ],
};

// Key white-ball attribute overrides for players already in the pools
const WB_OVR = {
  'Travis Head': { power: 93, finish: 82 }, 'Mitchell Marsh': { power: 90, finish: 84 }, 'Josh Inglis': { power: 88, finish: 86 }, 'Cameron Green': { power: 86, finish: 82 },
  'Jake Fraser-McGurk': { power: 94, finish: 70 }, 'Mitch Owen': { power: 95, finish: 78 }, 'Cooper Connolly': { power: 84, finish: 82 }, 'Alex Carey': { finish: 86 }, 'Steve Smith': { power: 68, finish: 84 },
  'Adam Zampa': { vars: 90, death: 78 }, 'Nathan Ellis': { death: 90, vars: 92 }, 'Xavier Bartlett': { death: 76, vars: 78 }, 'Spencer Johnson': { death: 76, vars: 72 },
  'Sean Abbott': { death: 80, vars: 84 }, 'Ben Dwarshuis': { death: 82, vars: 80 }, 'Mitchell Starc': { death: 92, vars: 82 }, 'Pat Cummins': { death: 86, vars: 86 }, 'Josh Hazlewood': { death: 82, vars: 80 },
  'Mahli Beardman': { death: 68, vars: 66 }, 'Nikhil Chaudhary': { vars: 72 }, 'Riley Meredith': { death: 76 }, 'Billy Stanlake': { death: 72 }, 'Tanveer Sangha': { vars: 80 },
  'Sam Harper': { power: 82, finish: 80 }, 'Josh Philippe': { power: 84 }, 'Ben McDermott': { power: 88, finish: 80 }, 'Nic Maddinson': { power: 82 }, 'Ashton Turner': { power: 88, finish: 88 }, 'Hilton Cartwright': { power: 82, finish: 80 },
  'Aaron Hardie': { power: 82, finish: 80, death: 72 }, 'Will Sutherland': { power: 80 }, 'Jack Edwards': { power: 82 }, 'Liam Scott': { power: 76 }, 'Lloyd Pope': { vars: 78 }, 'Mitchell Swepson': { vars: 76 },
  'Harry Brook': { power: 90, finish: 88 }, 'Ben Duckett': { power: 86, finish: 80 }, 'Jamie Smith': { power: 86 }, 'Jacob Bethell': { power: 86, finish: 82 }, 'Jofra Archer': { death: 88, vars: 84 }, 'Brydon Carse': { death: 76 }, 'Joe Root': { power: 70, finish: 88 }, 'Mark Wood': { death: 80 }, 'Rehan Ahmed': { vars: 80 },
  'Jasprit Bumrah': { death: 97, vars: 94 }, 'Mohammed Siraj': { death: 78, vars: 76 }, 'Kuldeep Yadav': { vars: 90 }, 'Shubman Gill': { power: 82, finish: 86 }, 'KL Rahul': { power: 80, finish: 88 }, 'Rishabh Pant': { power: 90, finish: 84 },
  'Ravindra Jadeja': { power: 80, finish: 86, vars: 80 }, 'Yashasvi Jaiswal': { power: 90 }, 'Washington Sundar': { vars: 78 }, 'Nitish Kumar Reddy': { power: 82 },
  'Aiden Markram': { power: 82, finish: 82 }, 'Kagiso Rabada': { death: 86, vars: 84 }, 'Marco Jansen': { power: 82, death: 80 }, 'Anrich Nortje': { death: 84 }, 'Lungi Ngidi': { death: 80, vars: 84 }, 'Keshav Maharaj': { vars: 82 }, 'Gerald Coetzee': { death: 78 }, 'Corbin Bosch': { death: 82, vars: 84 }, 'Tristan Stubbs': { power: 88, finish: 86 }, 'Ryan Rickelton': { power: 86 }, 'Matthew Breetzke': { power: 82, finish: 84 },
  'Daryl Mitchell': { power: 84, finish: 88 }, 'Glenn Phillips': { power: 90, finish: 88 }, 'Mitchell Santner': { vars: 86, power: 78 }, 'Matt Henry': { death: 82, vars: 82 }, 'Rachin Ravindra': { power: 82 }, 'Devon Conway': { finish: 82 }, 'Kane Williamson': { finish: 86 }, 'Jacob Duffy': { death: 82, vars: 82 }, 'Will O\'Rourke': { death: 74 },
  'Babar Azam': { power: 76, finish: 84 }, 'Mohammad Rizwan': { finish: 84 }, 'Shaheen Shah Afridi': { death: 84, vars: 80 }, 'Salman Ali Agha': { finish: 80 }, 'Abrar Ahmed': { vars: 88 },
  'Kusal Mendis': { power: 82 }, 'Pathum Nissanka': { power: 82, finish: 82 }, 'Kamindu Mendis': { power: 80 }, 'Dilshan Madushanka': { death: 76 },
  'Shai Hope': { finish: 86 }, 'Brandon King': { power: 86 }, 'Alzarri Joseph': { death: 80, vars: 78 }, 'Shamar Joseph': { death: 76 }, 'Roston Chase': { vars: 74 }, 'Jayden Seales': { death: 72 },
  'Litton Das': { power: 84 }, 'Mehidy Hasan Miraz': { vars: 78 }, 'Taskin Ahmed': { death: 80, vars: 80 }, 'Najmul Hossain Shanto': { power: 74 },
  'Rashid Khan': { power: 84, vars: 96, death: 82 }, 'Ibrahim Zadran': { power: 82, finish: 82 },
  'Sikandar Raza': { power: 88, finish: 88, vars: 82 }, 'Brian Bennett': { power: 84 }, 'Blessing Muzarabani': { death: 80, vars: 76 },
  'Paul Stirling': { power: 88 }, 'Harry Tector': { finish: 82 }, 'Josh Little': { death: 78, vars: 78 }, 'Lorcan Tucker': { power: 80 }, 'Mark Adair': { death: 76 },
};

// International white-ball availability: 'odi' = ODIs only, 't20' = T20Is only, 'none' = franchise and domestic only
const WB_INTL = { 'Glenn Maxwell': 't20', 'Marcus Stoinis': 't20', 'Rohit Sharma': 'odi', 'Virat Kohli': 'odi', 'Ravindra Jadeja': 'odi', 'Mitchell Starc': 'odi', 'Kane Williamson': 'odi',
  'Steve Smith': 'none', 'Usman Khawaja': 'none', 'David Warner': 'none', 'Nathan Lyon': 'none', 'Marnus Labuschagne': 'odi', 'Usman Tariq': 't20', 'Jasprit Bumrah': 'all', 'Babar Azam': 'all' };

// ---------- White-ball attribute defaults ----------
function wbInit(p) {
  const o = Object.assign({}, WB_OVR[p.name] || {}, p.wb0 || {});
  const b = p.bat, bl = (b.tech + b.conc + b.vPace + b.vSpin) / 4;
  if (b.power == null) b.power = Math.round(o.power || Math.min(97, b.agg * 0.6 + bl * 0.35 + hashN(p.name + 'pw') * 5));
  if (b.finish == null) b.finish = Math.round(o.finish || Math.min(95, b.agg * 0.35 + bl * 0.6 + hashN(p.name + 'fn') * 5));
  if (p.bowl) {
    const w = p.bowl;
    if (w.death == null) w.death = Math.round(o.death || w.skill * 0.55 + w.acc * 0.35 + hashN(p.name + 'dt') * 5 - (['OB', 'LB', 'SLA'].includes(w.type) ? 4 : 0));
    if (w.vars == null) w.vars = Math.round(o.vars || w.skill * 0.7 + hashN(p.name + 'vr') * 6);
  }
  delete p.wb0;
  return p;
}

// merge specialists into the national pools
Object.keys(WB_EXTRA).forEach(code => WB_EXTRA[code].forEach(p => {
  const ex = TEAMS[code].squad.find(q => q.name === p.name);
  if (ex) { ex.wb0 = Object.assign({}, ex.wb0 || {}, p.wb0 || {}); return; }
  p.nat = code; TEAMS[code].squad.push(p);
}));
Object.keys(TEAMS).forEach(code => TEAMS[code].squad.forEach(p => { if (WB_INTL[p.name] && WB_INTL[p.name] !== 'all') p.intl = WB_INTL[p.name]; wbInit(p); }));

// ---------- BBL|16 clubs (real squads, Oct 2026) ----------
const BBL_CLUBS = {
  STR: { name: 'Adelaide Strikers', home: 'adelaide', squad: ['Alex Carey', 'Mark Chapman', 'Mackenzie Harvey', 'Thomas Kelly', 'Lloyd Pope', 'Haris Rauf', 'Jason Sangha', 'Liam Scott', 'Harjas Singh', 'Matt Short', 'Ben Stokes', 'Tom Straker', 'Henry Thornton', 'Jerrssis Wadia'] },
  HEA: { name: 'Brisbane Heat', home: 'gabba', squad: ['Xavier Bartlett', 'Max Bryant', 'Tom Curran', 'Lachlan Hearne', 'Bevon Jacobs', 'Spencer Johnson', 'Usman Khawaja', 'Matthew Kuhnemann', 'Nathan McSweeney', 'Michael Neser', 'Jimmy Peirson', 'Matthew Renshaw', 'Tim Robinson', 'Callum Vidler', 'Hugh Weibgen', 'Jack Wildermuth'] },
  HUR: { name: 'Hobart Hurricanes', home: 'hobart', squad: ['Marcus Bean', 'Iain Carlisle', 'Nikhil Chaudhary', 'Tim David', 'Nathan Ellis', 'Nick Hobson', 'Shai Hope', 'Ben McDermott', 'Riley Meredith', 'Mitch Owen', 'Will Prestwidge', 'Billy Stanlake', 'Tim Ward', 'Jake Weatherald', 'Beau Webster', 'Adam Zampa'] },
  REN: { name: 'Melbourne Renegades', home: 'marvel', squad: ['Michael Archer', 'Jonny Bairstow', 'Jason Behrendorff', 'Michael Bracewell', 'Josh Brown', 'Harry Dixon', 'Brendan Doggett', 'Sam Elliott', 'Jake Fraser-McGurk', 'Caleb Jewell', 'Ben Manenti', 'Oliver Peake', 'Tom Rogers', 'Callum Stow', 'Will Sutherland'] },
  STA: { name: 'Melbourne Stars', home: 'mcg', squad: ['Finn Allen', 'Austin Anlezark', 'Hilton Cartwright', 'Sam Harper', 'Liam Hatcher', 'Campbell Kellaway', 'Glenn Maxwell', 'Peter Siddle', 'Marcus Stoinis', 'Mitchell Swepson', 'Todd Murphy', 'Jamie Overton', 'Craig Overton'] },
  SCO: { name: 'Perth Scorchers', home: 'perth', squad: ['Ashton Agar', 'Mahli Beardman', 'Cooper Connolly', 'Brody Couch', 'Zak Crawley', 'Joel Curtis', 'Aneurin Donald', 'Albert Esterhuysen', 'Aaron Hardie', 'Calvin Harrison', 'Mitchell Marsh', 'Will Malajczuk', 'Lance Morris', 'Joel Paris', 'Jhye Richardson', 'Ashton Turner'] },
  SIX: { name: 'Sydney Sixers', home: 'scg', squad: ['Sean Abbott', 'Jafer Chohan', 'Joel Davies', 'Oliver Davies', 'Ben Dwarshuis', 'Jack Edwards', 'Chris Jordan', 'Hayden Kerr', 'Riley Kingsell', 'Fergus O\'Neill', 'Josh Philippe', 'Corey Rocchiccioli', 'Jake Scott', 'Tim Seifert', 'Lachlan Shaw', 'Jordan Silk', 'Steve Smith'] },
  THU: { name: 'Sydney Thunder', home: 'showground', squad: ['Cameron Bancroft', 'Sam Billings', 'Lockie Ferguson', 'Matthew Gilkes', 'Chris Green', 'Ryan Hadley', 'Sam Konstas', 'Nic Maddinson', 'Will Salzmann', 'Daniel Sams', 'Tanveer Sangha', 'David Warner', 'Trent Boult'] },
};

// Extra white-ball venues
Object.assign(VENUES, {
  manuka: V('AUS', 'Manuka Oval, Canberra', 0, 1, 2, 1.0, 'Small, fast-scoring ground.'),
  carrara: V('AUS', 'People First Stadium, Gold Coast', 1, 0, 1, 1.0, 'Big boundaries, decent pace.'),
  marvel: V('AUS', 'Marvel Stadium, Melbourne', 1, 0, 2, 1.0, 'Under the roof. True and quick.'),
  showground: V('AUS', 'ENGIE Stadium, Sydney', 0, 2, 1, 1.0, 'Sydney Thunder\'s home. Grips and turns.'),
});
const LO_ONLY = ['manuka', 'carrara', 'marvel', 'showground'];

// Real squads and captains
const AUS_ODI_SQUAD_2026 = ['Mitchell Marsh', 'Xavier Bartlett', 'Mahli Beardman', 'Alex Carey', 'Cooper Connolly', 'Jack Edwards', 'Cameron Green', 'Travis Head', 'Josh Inglis', 'Spencer Johnson', 'Oliver Peake', 'Matthew Renshaw', 'Liam Scott', 'Adam Zampa'];
const WB_CAPT = { odi: ['Mitchell Marsh', 'Travis Head'], t20: ['Mitchell Marsh', 'Travis Head'] };
const LEAD_WB = { 'Mitchell Marsh': 82, 'Suryakumar Yadav': 80, 'Harry Brook': 76, 'Mitchell Santner': 82, 'Charith Asalanka': 76, 'Shai Hope': 76, 'Litton Das': 70, 'Rashid Khan': 84, 'Sikandar Raza': 82, 'Matt Short': 70, 'Nathan Ellis': 72, 'Marcus Stoinis': 76 };

// Real white-ball rankings (Oct-Nov 2026) used as seeds
const RANK_SEED_ODI = { IND: 118, NZ: 113, AUS: 109, SA: 104, PAK: 98, SL: 96, AFG: 93, ENG: 90, BAN: 84, WI: 74, IRE: 46, ZIM: 44 };
const RANK_SEED_T20 = { IND: 273, AUS: 263, ENG: 258, NZ: 251, SA: 247, PAK: 238, WI: 236, SL: 231, AFG: 229, BAN: 222, IRE: 196, ZIM: 192 };
const REAL_WB = {
  odiBat: { 'Shubman Gill': 841, 'Daryl Mitchell': 794, 'Virat Kohli': 781, 'Shreyas Iyer': 777, 'Rohit Sharma': 770, 'Babar Azam': 740, 'Joe Root': 720, 'Charith Asalanka': 705 },
  odiBowl: { 'Rashid Khan': 710, 'Jofra Archer': 670, 'Kuldeep Yadav': 655, 'Maheesh Theekshana': 647, 'Keshav Maharaj': 640, 'Mitchell Santner': 630, 'Adam Zampa': 620 },
  t20Bat: { 'Abhishek Sharma': 875, 'Ishan Kishan': 871, 'Sahibzada Farhan': 848, 'Phil Salt': 800, 'Travis Head': 780, 'Tilak Varma': 760, 'Pathum Nissanka': 750, 'Dewald Brevis': 740, 'Suryakumar Yadav': 730, 'Jos Buttler': 716 },
  t20Bowl: { 'Rashid Khan': 753, 'Varun Chakravarthy': 740, 'Corbin Bosch': 725, 'Adil Rashid': 715, 'Akeal Hosein': 705, 'Jasprit Bumrah': 700, 'Mitchell Santner': 695, 'Adam Zampa': 690, 'Mustafizur Rahman': 680, 'Mujeeb Ur Rahman': 675 },
};

// ICC white-ball events
const ICC_EVENTS = [
  { season: 2027, after: 'spr', fmt: 'odi', name: 'ODI World Cup 2027', host: ['SA', 'ZIM'], months: 'Oct to Nov' },
  { season: 2028, after: 'spr', fmt: 't20', name: 'T20 World Cup 2028', host: ['AUS', 'NZ'], months: 'Oct to Nov' },
  { season: 2030, after: 'win', fmt: 't20', name: 'T20 World Cup 2030', host: ['ENG', 'IRE'], months: 'Jun to Jul' },
  { season: 2031, after: 'spr', fmt: 'odi', name: 'ODI World Cup 2031', host: ['IND', 'BAN'], months: 'Oct to Nov' },
  { season: 2032, after: 'spr', fmt: 't20', name: 'T20 World Cup 2032', host: ['SA', 'ZIM'], months: 'Oct to Nov' },
  { season: 2034, after: 'win', fmt: 't20', name: 'T20 World Cup 2034', host: ['WI'], months: 'Jun to Jul' },
  { season: 2035, after: 'spr', fmt: 'odi', name: 'ODI World Cup 2035', host: ['ENG', 'IRE'], months: 'Oct to Nov' },
];

if (typeof module !== 'undefined') Object.assign(module.exports, { WB_EXTRA, WB_OVR, wbInit, BBL_CLUBS, LO_ONLY, AUS_ODI_SQUAD_2026, WB_CAPT, LEAD_WB, RANK_SEED_ODI, RANK_SEED_T20, REAL_WB, ICC_EVENTS });

// Real-life white-ball assessment (Nov 2026): target ODI and T20 OVR for established players.
// The game stores the gap between these and the formula as a permanent white-ball trait (p.wbo), so specialists who are only
// average first-class cricketers (Zampa, Ellis, Tim David) still rate as the white-ball players they are.
const WB_TARGET = {
  // Australia
  'Travis Head': [88, 89], 'Mitchell Marsh': [82, 84], 'Josh Inglis': [81, 83], 'Cameron Green': [81, 80], 'Alex Carey': [80, 76], 'Glenn Maxwell': [79, 85], 'Tim David': [77, 85], 'Marcus Stoinis': [79, 82],
  'Matt Short': [79, 82], 'Jake Fraser-McGurk': [74, 79], 'Mitch Owen': [72, 80], 'Cooper Connolly': [77, 79], 'Adam Zampa': [84, 85], 'Nathan Ellis': [80, 85], 'Josh Hazlewood': [85, 84],
  'Mitchell Starc': [87, 85], 'Pat Cummins': [86, 82], 'Xavier Bartlett': [78, 80], 'Spencer Johnson': [76, 79], 'Sean Abbott': [78, 79], 'Ben Dwarshuis': [77, 80], 'Steve Smith': [82, 77],
  'Marnus Labuschagne': [79, 70], 'Matthew Renshaw': [76, 72], 'Jack Edwards': [74, 75], 'Liam Scott': [72, 72], 'Tanveer Sangha': [74, 78], 'Jason Behrendorff': [77, 79], 'Ashton Agar': [74, 76],
  'Daniel Sams': [74, 79], 'Aaron Hardie': [76, 77], 'Sam Konstas': [72, 74], 'Ben McDermott': [74, 78], 'Sam Harper': [72, 77], 'Josh Philippe': [72, 77], 'David Warner': [78, 81], 'Usman Khawaja': [75, 74],
  'Ashton Turner': [73, 78], 'Riley Meredith': [72, 75], 'Nathan Lyon': [77, 68], 'Scott Boland': [77, 74], 'Mahli Beardman': [72, 72], 'Oliver Peake': [70, 70], 'Lloyd Pope': [70, 75], 'Chris Green': [70, 76],
  'Max Bryant': [70, 76], 'Nick Hobson': [70, 76], 'Michael Neser': [76, 76], 'Matthew Kuhnemann': [74, 73], 'Beau Webster': [75, 75],
  // India
  'Shubman Gill': [90, 82], 'Virat Kohli': [89, 84], 'Rohit Sharma': [86, 84], 'Shreyas Iyer': [85, 78], 'KL Rahul': [84, 76], 'Rishabh Pant': [80, 80], 'Yashasvi Jaiswal': [78, 82], 'Abhishek Sharma': [78, 90],
  'Ishan Kishan': [79, 87], 'Suryakumar Yadav': [75, 85], 'Hardik Pandya': [82, 84], 'Axar Patel': [80, 82], 'Ravindra Jadeja': [82, 79], 'Tilak Varma': [77, 85], 'Rinku Singh': [74, 82], 'Sanju Samson': [76, 81],
  'Shivam Dube': [74, 80], 'Jasprit Bumrah': [93, 93], 'Kuldeep Yadav': [86, 85], 'Varun Chakravarthy': [80, 89], 'Arshdeep Singh': [79, 86], 'Mohammed Siraj': [82, 78], 'Harshit Rana': [77, 77], 'Washington Sundar': [77, 79],
  // England
  'Harry Brook': [85, 86], 'Joe Root': [86, 78], 'Jos Buttler': [83, 86], 'Phil Salt': [78, 88], 'Ben Duckett': [82, 81], 'Jamie Smith': [78, 81], 'Jacob Bethell': [79, 81], 'Will Jacks': [78, 82],
  'Liam Livingstone': [75, 80], 'Jofra Archer': [86, 86], 'Adil Rashid': [83, 86], 'Sam Curran': [77, 81], 'Brydon Carse': [77, 77], 'Mark Wood': [78, 78], 'Gus Atkinson': [77, 75], 'Saqib Mahmood': [76, 80],
  'Jamie Overton': [75, 79], 'Tom Banton': [72, 79], 'Ben Stokes': [80, 80], 'Ollie Robinson': [74, 72], 'Ollie Pope': [73, 70], 'Jonny Bairstow': [76, 79], 'Tom Curran': [72, 78], 'Chris Jordan': [70, 76],
  // South Africa
  'Aiden Markram': [82, 82], 'Quinton de Kock': [83, 82], 'Ryan Rickelton': [80, 82], 'Temba Bavuma': [78, 70], 'Matthew Breetzke': [81, 76], 'Tristan Stubbs': [79, 83], 'Dewald Brevis': [77, 86],
  'David Miller': [78, 82], 'Marco Jansen': [81, 82], 'Kagiso Rabada': [86, 84], 'Keshav Maharaj': [83, 80], 'Lungi Ngidi': [79, 81], 'Corbin Bosch': [77, 84], 'Anrich Nortje': [78, 81], 'Kwena Maphaka': [72, 76],
  'Gerald Coetzee': [76, 78], 'Tabraiz Shamsi': [76, 79], 'Simon Harmer': [73, 70], 'David Bedingham': [74, 72],
  // New Zealand
  'Daryl Mitchell': [88, 80], 'Kane Williamson': [85, 78], 'Rachin Ravindra': [82, 80], 'Devon Conway': [81, 79], 'Glenn Phillips': [81, 82], 'Mitchell Santner': [84, 85], 'Matt Henry': [85, 81], 'Jacob Duffy': [82, 82],
  'Lockie Ferguson': [80, 82], 'Finn Allen': [75, 83], 'Mark Chapman': [77, 80], 'Michael Bracewell': [79, 80], 'Tim Seifert': [74, 81], 'Tom Latham': [79, 70], 'Trent Boult': [80, 80], 'Ish Sodhi': [75, 79],
  'Jimmy Neesham': [73, 78], 'Bevon Jacobs': [70, 77], 'Tim Robinson': [70, 76], 'Kyle Jamieson': [78, 77], 'Will O\'Rourke': [76, 74], 'Tom Blundell': [74, 72],
  // Pakistan
  'Babar Azam': [83, 78], 'Mohammad Rizwan': [80, 76], 'Fakhar Zaman': [78, 77], 'Saim Ayub': [77, 80], 'Sahibzada Farhan': [73, 87], 'Salman Ali Agha': [77, 76], 'Shaheen Shah Afridi': [84, 83],
  'Haris Rauf': [78, 81], 'Naseem Shah': [80, 78], 'Abrar Ahmed': [79, 84], 'Shadab Khan': [75, 79], 'Mohammad Nawaz': [74, 78], 'Hasan Nawaz': [70, 78], 'Abdullah Shafique': [75, 72], 'Mohammad Abbas': [72, 70],
  'Shan Masood': [72, 72], 'Saud Shakeel': [74, 70],
  // Sri Lanka
  'Pathum Nissanka': [82, 84], 'Kusal Mendis': [80, 80], 'Charith Asalanka': [82, 80], 'Kamindu Mendis': [79, 78], 'Wanindu Hasaranga': [80, 86], 'Maheesh Theekshana': [84, 84], 'Matheesha Pathirana': [75, 82],
  'Kusal Perera': [73, 79], 'Dunith Wellalage': [76, 76], 'Nuwan Thushara': [74, 79], 'Dilshan Madushanka': [77, 77],
  // West Indies
  'Shai Hope': [84, 80], 'Brandon King': [77, 81], 'Shimron Hetmyer': [76, 81], 'Rovman Powell': [72, 81], 'Sherfane Rutherford': [76, 81], 'Evin Lewis': [74, 79], 'Romario Shepherd': [73, 79],
  'Alzarri Joseph': [79, 80], 'Gudakesh Motie': [78, 80], 'Akeal Hosein': [77, 84], 'Jason Holder': [76, 78], 'Roston Chase': [73, 72], 'Jayden Seales': [77, 76], 'Shamar Joseph': [77, 77],
  // Bangladesh
  'Litton Das': [73, 78], 'Towhid Hridoy': [77, 76], 'Tanzid Hasan': [73, 77], 'Najmul Hossain Shanto': [76, 74], 'Mehidy Hasan Miraz': [80, 78], 'Mustafizur Rahman': [79, 84], 'Taskin Ahmed': [79, 80],
  'Rishad Hossain': [75, 79], 'Mahedi Hasan': [74, 77], 'Tanzim Hasan Sakib': [73, 76],
  // Afghanistan
  'Rashid Khan': [84, 90], 'Rahmanullah Gurbaz': [80, 81], 'Ibrahim Zadran': [82, 79], 'Azmatullah Omarzai': [82, 81], 'Mohammad Nabi': [77, 78], 'Noor Ahmad': [78, 85], 'Mujeeb Ur Rahman': [79, 83],
  'Fazalhaq Farooqi': [77, 79], 'Naveen-ul-Haq': [74, 80], 'Sediqullah Atal': [74, 76], 'Hashmatullah Shahidi': [75, 70], 'Rahmat Shah': [74, 68],
  // Zimbabwe and Ireland
  'Sikandar Raza': [81, 83], 'Brian Bennett': [76, 78], 'Blessing Muzarabani': [78, 78], 'Ryan Burl': [72, 76], 'Tadiwanashe Marumani': [68, 73],
  'Paul Stirling': [77, 78], 'Harry Tector': [79, 74], 'Josh Little': [76, 78], 'Lorcan Tucker': [74, 75], 'Mark Adair': [72, 75], 'George Dockrell': [70, 72], 'Gareth Delany': [68, 74],
};
if (typeof module !== 'undefined') Object.assign(module.exports, { WB_TARGET });
