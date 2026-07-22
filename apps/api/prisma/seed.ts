import { PrismaClient, Role, Category, BudgetType } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function hash(password: string) {
  return bcrypt.hash(password, 12);
}

async function main() {
  const adminEmail = (process.env.ADMIN_EMAIL ?? "superadmin").toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD ?? "admin1234";
  const adminName = process.env.ADMIN_NAME ?? "BuildScience Administrator";
  const adminPhone = process.env.ADMIN_PHONE ?? "+998901234567";

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      role: Role.ADMIN,
      name: adminName,
      email: adminEmail,
      phone: adminPhone,
      passwordHash: await hash(adminPassword),
      status: "ACTIVE",
    },
  });

  const companyPassword = await hash("Company12345!");
  const scientistPassword = await hash("Scientist12345!");

  const companyA = await prisma.user.upsert({
    where: { email: "qurilish-invest@buildscience.local" },
    update: {},
    create: {
      role: Role.COMPANY,
      name: "QurilishInvest MChJ",
      email: "qurilish-invest@buildscience.local",
      phone: "+998901112233",
      passwordHash: companyPassword,
      status: "ACTIVE",
    },
  });

  const companyB = await prisma.user.upsert({
    where: { email: "betonstroy@buildscience.local" },
    update: {},
    create: {
      role: Role.COMPANY,
      name: "BetonStroy Servis",
      email: "betonstroy@buildscience.local",
      phone: "+998902223344",
      passwordHash: companyPassword,
      status: "ACTIVE",
    },
  });

  const scientist1 = await prisma.user.upsert({
    where: { email: "aziz.karimov@buildscience.local" },
    update: {},
    create: {
      role: Role.SCIENTIST,
      name: "Aziz Karimov",
      email: "aziz.karimov@buildscience.local",
      phone: "+998903334455",
      passwordHash: scientistPassword,
      organization: "Toshkent Arxitektura-Qurilish Instituti",
      specialization: "Beton texnologiyalari",
      bio: "10 yillik tajribaga ega beton texnologiyalari bo'yicha ilmiy xodim.",
      status: "ACTIVE",
    },
  });

  const scientist2 = await prisma.user.upsert({
    where: { email: "nodira.yusupova@buildscience.local" },
    update: {},
    create: {
      role: Role.SCIENTIST,
      name: "Nodira Yusupova",
      email: "nodira.yusupova@buildscience.local",
      phone: "+998904445566",
      passwordHash: scientistPassword,
      organization: "O'zbekiston Milliy Universiteti, Kimyo fakulteti",
      specialization: "Qurilish kimyosi",
      bio: "Sement va qorishma kimyoviy tarkibini optimallashtirish bo'yicha tadqiqotchi.",
      status: "ACTIVE",
    },
  });

  const scientist3 = await prisma.user.upsert({
    where: { email: "bekzod.rahimov@buildscience.local" },
    update: {},
    create: {
      role: Role.SCIENTIST,
      name: "Bekzod Rahimov",
      email: "bekzod.rahimov@buildscience.local",
      phone: "+998905556677",
      passwordHash: scientistPassword,
      organization: "Seysmik Barqarorlik Ilmiy-Tadqiqot Instituti",
      specialization: "Seysmik xavfsizlik",
      bio: "Zilzilaga chidamli konstruksiyalar bo'yicha muhandis-tadqiqotchi.",
      status: "ACTIVE",
    },
  });

  console.log("Accounts seeded:");
  console.log(`  Admin:      ${adminEmail} / ${adminPassword}`);
  console.log("  Company A:  qurilish-invest@buildscience.local / Company12345!");
  console.log("  Company B:  betonstroy@buildscience.local / Company12345!");
  console.log("  Scientist1: aziz.karimov@buildscience.local / Scientist12345!");
  console.log("  Scientist2: nodira.yusupova@buildscience.local / Scientist12345!");
  console.log("  Scientist3: bekzod.rahimov@buildscience.local / Scientist12345!");

  if (process.env.NODE_ENV === "production" && process.env.SEED_FORCE !== "1") {
    console.log("NODE_ENV=production: skipping sample problems/proposals (accounts above are seeded).");
    console.log("Set SEED_FORCE=1 to force-reset sample data in production.");
    return;
  }

  await prisma.proposal.deleteMany({});
  await prisma.problem.deleteMany({});

  const problem1 = await prisma.problem.create({
    data: {
      companyId: companyA.id,
      title: "Beton mustahkamligini 20 foizga oshirish yo'llari",
      description:
        "Bizning quyma beton mahsulotlarimiz standart mustahkamlik ko'rsatkichlariga ega, lekin loyihalarimiz uchun yuqoriroq mustahkamlik talab qilinmoqda. Mavjud xomashyo tarkibini o'zgartirmasdan yoki minimal qo'shimchalar bilan beton mustahkamligini kamida 20 foiz oshirish bo'yicha ilmiy asoslangan yechim izlaymiz. Ishlab chiqarish hajmi oyiga 500 kub metr.",
      category: Category.CONCRETE_CEMENT,
      budgetType: BudgetType.FIXED,
      budgetAmount: 25000000,
      status: "OPEN",
    },
  });

  const problem2 = await prisma.problem.create({
    data: {
      companyId: companyA.id,
      title: "Sement sarfini kamaytirish bo'yicha texnologik yechim",
      description:
        "Qurilish loyihalarimizda sement narxi umumiy xarajatning katta qismini tashkil etadi. Qorishma sifatini pasaytirmagan holda sement sarfini kamaytirish uchun alternativ bog'lovchi materiallar yoki texnologik yechimlar bo'yicha taklif kutamiz. Amaliy sinovdan o'tgan yechimlarga ustunlik beriladi.",
      category: Category.CONCRETE_CEMENT,
      budgetType: BudgetType.NEGOTIABLE,
      status: "OPEN",
    },
  });

  const problem3 = await prisma.problem.create({
    data: {
      companyId: companyB.id,
      title: "Energiya samaradorligi yuqori g'isht ishlab chiqarish",
      description:
        "Qish faslida issiqlik yo'qotilishini kamaytiradigan, issiqlik o'tkazuvchanligi past bo'lgan qurilish g'ishtlarini ishlab chiqarishni yo'lga qo'ymoqchimiz. Mavjud zavod uskunalarimizga moslashadigan tarkib va texnologiya bo'yicha ilmiy taklif kerak. Natija sinov namunalarida tasdiqlangan bo'lishi kerak.",
      category: Category.ENERGY_EFFICIENCY,
      budgetType: BudgetType.FIXED,
      budgetAmount: 18000000,
      status: "OPEN",
    },
  });

  const problem4 = await prisma.problem.create({
    data: {
      companyId: companyB.id,
      title: "Ko'p qavatli binolar uchun seysmik barqarorlikni oshirish",
      description:
        "Toshkent shahrida qurilayotgan 9 qavatli turar-joy majmuasi uchun mavjud konstruktiv yechimni seysmik xavfsizlik nuqtai nazaridan qayta baholash va qo'shimcha mustahkamlash tavsiyalarini ishlab chiqish talab etiladi. Loyiha hujjatlari mavjud, ekspert xulosasi kerak.",
      category: Category.SEISMIC_SAFETY,
      budgetType: BudgetType.FIXED,
      budgetAmount: 40000000,
      status: "OPEN",
    },
  });

  const problem5 = await prisma.problem.create({
    data: {
      companyId: companyA.id,
      title: "Qurilish chiqindilarini qayta ishlash texnologiyasi",
      description:
        "Ob'ektlarimizda yig'iladigan beton va g'isht sinig'ilarini qayta ishlab, yangi qurilish materiallariga aylantirish bo'yicha amaliy, arzon texnologiya izlaymiz. Ekologik talablarga javob beradigan va rentabelligi asoslangan yechim ustuvor.",
      category: Category.ECOLOGY,
      budgetType: BudgetType.NEGOTIABLE,
      status: "OPEN",
    },
  });

  const problem6 = await prisma.problem.create({
    data: {
      companyId: companyB.id,
      title: "Qurilish materiallari logistikasini optimallashtirish",
      description:
        "Bir nechta viloyatlardagi qurilish ob'ektlariga material yetkazib berish xarajatlarini kamaytirish va yetkazib berish muddatlarini qisqartirish uchun logistik model va marshrutlashtirish algoritmi ustida ilmiy asoslangan taklif kerak.",
      category: Category.LOGISTICS,
      budgetType: BudgetType.FIXED,
      budgetAmount: 12000000,
      status: "OPEN",
    },
  });

  const problem7 = await prisma.problem.create({
    data: {
      companyId: companyA.id,
      title: "Namlikka chidamli fasad qoplama tarkibi",
      description:
        "Farg'ona vodiysidagi ob-havo sharoitlariga mos, namlik va harorat farqiga chidamli fasad qoplama qorishmasi tarkibini ishlab chiqish kerak. Mavjud qoplamalarimiz 2-3 yilda yorilib, mikroyoriqlar hosil qilmoqda.",
      category: Category.BUILDING_MATERIALS,
      budgetType: BudgetType.NEGOTIABLE,
      status: "OPEN",
    },
  });

  const problem8 = await prisma.problem.create({
    data: {
      companyId: companyB.id,
      title: "Qorishmalar uchun kimyoviy qo'shimchalarni optimallashtirish",
      description:
        "Sovuq iqlim sharoitida ishlatiladigan qorishmalarimizning qotish vaqtini va sovuqqa chidamliligini yaxshilash uchun kimyoviy qo'shimchalar tarkibini ilmiy asoslangan tarzda optimallashtirish kerak.",
      category: Category.CHEMISTRY,
      budgetType: BudgetType.FIXED,
      budgetAmount: 15000000,
      status: "OPEN",
    },
  });

  // Pending proposals on open problems
  await prisma.proposal.create({
    data: {
      problemId: problem1.id,
      scientistId: scientist1.id,
      solutionText:
        "Beton tarkibiga mikrokremniy (silica fume) qo'shilishi va suv-sement nisbatini 0.45 dan 0.38 gacha kamaytirish orqali bosimga chidamlilikni 20-25 foizga oshirish mumkin. Ushbu usulni 3 xil qorishma nisbatida laboratoriya sharoitida sinovdan o'tkazishni taklif qilaman.",
      estimatedDays: 45,
      priceNegotiable: false,
      proposedPrice: 22000000,
      status: "PENDING",
    },
  });

  await prisma.proposal.create({
    data: {
      problemId: problem1.id,
      scientistId: scientist2.id,
      solutionText:
        "Beton tarkibiga polikarboksilat asosidagi superplastifikator va uchuvchi kul qo'shish orqali ham mustahkamlik, ham ishlanuvchanlikni yaxshilash mumkin. Tajriba-sinov bosqichi va ishlab chiqarish nazorati bo'yicha texnik xarita tayyorlab beraman.",
      estimatedDays: 30,
      priceNegotiable: true,
      status: "PENDING",
    },
  });

  await prisma.proposal.create({
    data: {
      problemId: problem3.id,
      scientistId: scientist1.id,
      solutionText:
        "G'isht xomashyosiga perlit va kul qo'shimchalari kiritish orqali issiqlik o'tkazuvchanligini 30 foizgacha pasaytirish mumkin. Bunda mustahkamlik standartlari saqlanib qoladi. Sinov partiyasi uchun texnologik reglament tayyorlayman.",
      estimatedDays: 60,
      priceNegotiable: false,
      proposedPrice: 16500000,
      status: "PENDING",
    },
  });

  await prisma.proposal.create({
    data: {
      problemId: problem7.id,
      scientistId: scientist2.id,
      solutionText:
        "Fasad qorishmasiga gidrofobizatsiyalovchi qo'shimchalar va elastik polimer tolalar kiritish orqali namlik va harorat o'zgarishiga chidamlilikni sezilarli oshirish mumkin. Mahalliy iqlim sharoitida 6 oylik dala sinovi rejasini taklif qilaman.",
      estimatedDays: 90,
      priceNegotiable: true,
      status: "PENDING",
    },
  });

  await prisma.proposal.create({
    data: {
      problemId: problem8.id,
      scientistId: scientist2.id,
      solutionText:
        "Sovuqqa chidamli qorishma uchun kalsiy-xlorid o'rniga zamonaviy organik antifriz qo'shimchalarni tavsiya qilaman. Bu korroziya xavfini kamaytiradi va qotish vaqtini -5°C haroratda ham barqaror ushlab turadi.",
      estimatedDays: 40,
      priceNegotiable: false,
      proposedPrice: 14000000,
      status: "PENDING",
    },
  });

  // Matched problem: one accepted, one rejected
  const problem9 = await prisma.problem.create({
    data: {
      companyId: companyA.id,
      title: "Qurilish maydonchasida chang va shovqinni kamaytirish",
      description:
        "Shahar markazidagi qurilish maydonchamizda atrof-muhitga chang va shovqin ta'sirini kamaytirish bo'yicha amaliy va arzon yechimlar kerak. Sanitariya normalariga muvofiqlik muhim ahamiyatga ega.",
      category: Category.ECOLOGY,
      budgetType: BudgetType.FIXED,
      budgetAmount: 8000000,
      status: "OPEN",
    },
  });

  const acceptedProposal = await prisma.proposal.create({
    data: {
      problemId: problem9.id,
      scientistId: scientist3.id,
      solutionText:
        "Vaqtinchalik akustik ekranlar va suv-tuman purkash tizimini birgalikda qo'llash orqali chang darajasini 70 foizga, shovqinni esa 15-20 dB ga kamaytirish mumkin. O'rnatish sxemasi va texnik hisob-kitobni taqdim etaman.",
      estimatedDays: 20,
      priceNegotiable: false,
      proposedPrice: 7200000,
      status: "PENDING",
    },
  });

  const rejectedProposal = await prisma.proposal.create({
    data: {
      problemId: problem9.id,
      scientistId: scientist1.id,
      solutionText:
        "Maydoncha perimetri bo'ylab vaqtinchalik yashil devor va tuproq namligini saqlovchi qoplama yordamida changni kamaytirish mumkin. Bu usul biroz sekinroq natija beradi, lekin uzoq muddatli ekologik foyda beradi.",
      estimatedDays: 35,
      priceNegotiable: true,
      status: "PENDING",
    },
  });

  await prisma.$transaction([
    prisma.proposal.update({
      where: { id: acceptedProposal.id },
      data: { status: "ACCEPTED", acceptedAt: new Date() },
    }),
    prisma.proposal.update({
      where: { id: rejectedProposal.id },
      data: { status: "REJECTED" },
    }),
    prisma.problem.update({
      where: { id: problem9.id },
      data: { status: "MATCHED", matchedAt: new Date() },
    }),
  ]);

  // Closed problem with rejected pending proposals
  const problem10 = await prisma.problem.create({
    data: {
      companyId: companyB.id,
      title: "Qurilish inshootlari uchun arzon issiqlik izolyatsiyasi",
      description:
        "Ombor binolarimiz uchun mavjud minerall paxta o'rniga arzonroq, lekin samaradorligi kam bo'lmagan issiqlik izolyatsiya materialini izlagan edik. Loyiha rejalari o'zgargani sababli e'lon yopildi.",
      category: Category.ENERGY_EFFICIENCY,
      budgetType: BudgetType.NEGOTIABLE,
      status: "OPEN",
    },
  });

  const closedPendingProposal = await prisma.proposal.create({
    data: {
      problemId: problem10.id,
      scientistId: scientist3.id,
      solutionText:
        "Mahalliy ishlab chiqarilgan kengaytirilgan perlit asosidagi izolyatsiya plitalarini tavsiya qilaman. Narxi minerall paxtadan 30 foiz arzon, issiqlik o'tkazuvchanligi yaqin ko'rsatkichda.",
      estimatedDays: 25,
      priceNegotiable: false,
      proposedPrice: 9000000,
      status: "PENDING",
    },
  });

  await prisma.$transaction([
    prisma.proposal.update({
      where: { id: closedPendingProposal.id },
      data: { status: "REJECTED" },
    }),
    prisma.problem.update({
      where: { id: problem10.id },
      data: { status: "CLOSED", closedAt: new Date() },
    }),
  ]);

  console.log("Sample problems and proposals seeded.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
