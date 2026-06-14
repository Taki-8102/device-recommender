const strings = {
  en: {
    // ── Chat / App ──
    welcome:           "Hi! I'm Aiycom. Tell me what you're looking for, or use the guided setup below!",
    searching:         "Searching for the perfect device and nearby deals...",
    resultIntro:       "Here's what I found for you!",
    errorPrefix:       "Sorry, something went wrong:",
    inputPlaceholder:  "Type your request...",

    // ── Landing choices ──
    helpMeChoose:      "Help Me Choose",
    helpMeChooseSub:   "Answer a few quick questions for a personalized pick",
    typeOwn:           "Type Your Own Request",
    typeOwnSub:        "Describe what you need in the box below",

    // ── Sidebar ──
    chatbot:           "Chatbot",
    history:           "History",
    shops:             "Shops",
    login:             "Login / Register",
    shopDashboard:     "Shop Dashboard",
    sellerPortal:      "Seller Portal",
    adminPanel:        "Admin Panel",
    logout:            "Logout",

    // ── History page ──
    historyTitle:        "Search History",
    historyEmpty:        "No searches yet. Start a conversation!",
    historyLoginTitle:   "Your history is private",
    historyLoginDesc:    "Create an account to save your searches and revisit recommendations anytime.",
    loginBtn:            "Login",
    registerBtn:         "Register",

    // ── Shops page ──
    shopsTitle:          "Shop Directory",
    shopsSubtitle:       "Stores where you can buy the devices we recommend",
    shopsEmpty:          "No shops found.",
    verified:            "Verified Partner",
    pending:             "Pending",
    viewOnMap:           "View on map",

    // ── Wizard step titles ──
    step1Title:        "What type of device?",
    step2Title:        "What will you use the {device} for?",
    step3Title:        "Any brand preference?",
    step4Title:        "How long will you use it?",
    step5Title:        "Budget & Location",

    // ── Wizard buttons / labels ──
    back:              "Back",
    next:              "Next",
    search:            "Search",
    searching2:        "Searching...",
    budgetLabel:          "Budget",
    budgetPlaceholderLAK: "e.g. 5000000",
    currencyUSD:          "USD",
    currencyLAK:          "LAK",
    cityLabel:            "City (for nearby shops)",
    cityPlaceholder:      "e.g., Bangkok, Singapore...",
    noPreference:         "No preference",
    selectAtLeastOne:     "Select at least one",

    // ── Lifecycle options ──
    "~1 year":   "~1 Year",
    "2 years":   "2 Years",
    "3 years":   "3 Years",
    "4+ years":  "4+ Years",

    // ── Wizard device names ──
    Smartphone:        "Smartphone",
    Tablet:            "Tablet",
    Laptop:            "Laptop",

    // ── Wizard purposes ──
    "General Use":         "General Use",
    "Photography":         "Photography",
    "Gaming":              "Gaming",
    "Social Media":        "Social Media",
    "Work & Productivity": "Work & Productivity",
    "Entertainment":       "Entertainment",
    "Learning & Education":"Learning & Education",
    "Art & Drawing":       "Art & Drawing",
    "Office & Work":       "Office & Work",
    "Student & Education": "Student & Education",
    "Content Creation":    "Content Creation",
    "Programming":         "Programming",

    // ── Wizard auto-submit sentence ──
    wizardQuery:         "Recommend a {device} for {purposes}{brand} with a budget of {budget}{lifecycle}{city}.",
    wizardBrandPart:     " from {brand}",
    wizardCityPart:      " in {city}",
    wizardLifecyclePart: ", planning to use it for {lifecycle}",

    // ── Compare ──
    addCompare:        "Compare",
    removeCompare:     "Remove",
    compareSelected:   "{n} selected",
    compare:           "Compare Now",
    compareTitle:      "Side-by-Side Comparison",
    comparePrice:      "Price",

    // ── ProductCardMini ──
    fullSpecs:         "Full Specs",
    pros:              "Pros",
    cons:              "Cons",
    whereToBuy:        "Where to Buy",
    alternatives:      "Alternatives",
    moreDetails:       "More details",
    lessDetails:       "Less details",
    partner:           "Partner",

    // ── ProductCard ──
    whyMatches:        "Why This Matches You",
    specifications:    "Specifications",
    whereToBuyNear:    "Where to Buy Near You",
    altToConsider:     "Alternatives to Consider",
    searchAgain:       "Search Again",
    specialFeatures:   "Special Features:",
    somethingWrong:    "Something went wrong",
    tryAgain:          "Try Again",

    // ── Spec labels ──
    specDisplay:       "Display",
    specProcessor:     "Processor",
    specRam:           "RAM",
    specStorage:       "Storage",
    specBattery:       "Battery",
    specWeight:        "Weight",

    // ── Wizard drill-down step ──
    stepDrilldownTitle:   "Tell us more about {purpose}",
    stepPainPointsTitle:  "Any past frustrations with devices?",

    // Photography drill-down options
    "photo_casual":           "Casual Snapshots",
    "photo_casual_sub":       "Everyday moments",
    "photo_nighttravel":      "Night & Events",
    "photo_nighttravel_sub":  "Concerts, low-light, travel",
    "photo_nighttravel_badge":"Optical Zoom",
    "photo_vlog":             "Vlogging & Video",
    "photo_vlog_sub":         "Content creation",
    "photo_vlog_badge":       "OIS + 4K Front",

    // Gaming drill-down options
    "gaming_casual":           "Casual Games",
    "gaming_casual_sub":       "Puzzle, simple games",
    "gaming_competitive":      "Competitive",
    "gaming_competitive_sub":  "PUBG, Mobile Legends",
    "gaming_competitive_badge":"90Hz+",
    "gaming_heavy3d":          "Heavy 3D",
    "gaming_heavy3d_sub":      "Genshin Impact, COD Mobile",
    "gaming_heavy3d_badge":    "Flagship + Cooling",

    // Work drill-down options
    "work_light":       "Light Tasks",
    "work_light_sub":   "Email, browsing, docs",
    "work_power":       "Power Multitasking",
    "work_power_sub":   "Many apps, heavy workflows",
    "work_power_badge": "8GB+ RAM",

    // Pain points — shared
    "pain_battery": "Battery dies too fast",
    "pain_lag":     "Slow / lagging performance",
    "pain_cracking":"Device cracked easily",
    "pain_storage": "Not enough storage",
    "pain_camera":  "Disappointing camera",
    // Pain points — phone extra
    "pain_heat":    "Gets very hot",
    // Pain points — tablet
    "pain_display": "Poor screen quality",
    "pain_stylus":  "Bad stylus / pen support",
    // Pain points — laptop
    "pain_build":   "Keyboard / hinge broke",
    "pain_weight":  "Too heavy to carry",
    skipPainPoints: "No issues, skip this",

    // ── Laptop purpose drill-downs ──
    "prog_webdev":          "Web / App Development",
    "prog_webdev_sub":      "Frontend, backend, mobile apps",
    "prog_datascience":     "Data Science / AI",
    "prog_datascience_sub": "ML, data analysis, notebooks",
    "prog_datascience_badge":"GPU Boost",
    "prog_general":         "General Coding",
    "prog_general_sub":     "Scripts, coursework, mixed tasks",

    "content_video":        "Video Editing",
    "content_video_sub":    "4K/8K editing, color grading",
    "content_video_badge":  "GPU Required",
    "content_photo":        "Photo Editing",
    "content_photo_sub":    "Lightroom, Photoshop, RAW files",
    "content_music":        "Music Production",
    "content_music_sub":    "DAW, recording, mixing",

    // ── Tablet purpose drill-downs ──
    "art_pro":          "Professional Art",
    "art_pro_sub":      "Illustration, design, detail work",
    "art_pro_badge":    "Stylus Required",
    "art_casual_dd":    "Casual Sketching",
    "art_casual_dd_sub":"Notes, doodles, light drawing",

    // ── Laptop specs step ──
    stepLaptopSpecsTitle: "Screen size & portability?",
    screenCompact:        "Compact  13–14\"",
    screenCompact_sub:    "Lightweight, easy to carry",
    screenStandard:       "Standard  15\"",
    screenStandard_sub:   "Balanced size & power",
    screenLarge:          "Large  16–17\"",
    screenLarge_sub:      "Maximum screen real-estate",
    weightUltra:          "Ultraportable  < 1.5 kg",
    weightUltra_sub:      "Daily commute, travel",
    weightAny:            "Weight doesn't matter",
    weightAny_sub:        "Performance over portability",

    // ── Tablet specs step ──
    stepTabletSpecsTitle: "Screen size & stylus?",
    tabletSizeSmall:      "Small  8–10\"",
    tabletSizeSmall_sub:  "Pocketable, one-hand use",
    tabletSizeMedium:     "Medium  10–12\"",
    tabletSizeMedium_sub: "Best all-rounder",
    tabletSizeLarge:      "Large  12\"+",
    tabletSizeLarge_sub:  "Desktop-class workspace",
    stylusYes:            "Yes, I need a stylus",
    stylusYes_sub:        "Drawing, note-taking, signing",
    stylusNo:             "No stylus needed",
    stylusNo_sub:         "Browsing, media, games",

    // Brand alternator
    brandPremium:   "Premium",
    brandValue:     "Best Value",
    brandBestMoney: "Best specs for my money",
    brandOrType:    "Or type a brand name",
    brandTypePlaceholder: "e.g. Infinix, Tecno, Huawei...",

    // Post-recommendation action chips
    chipTradeoff:     "Trade-off Summary",
    chipCheaper:      "Find Cheaper",
    chipCompareAll:   "Compare All",
    loadingTradeoff:  "Analyzing differences...",
    loadingCheaper:   "Finding cheaper options...",
    tradeoffTitle:    "Trade-off Analysis",
    cheaperTitle:     "Cheaper Alternatives",

    // ── Sidebar (admin) ──
    userManagement:   "User Management",
    shopVerification: "Shop Verification",

    // ── Shared table columns ──
    colId:        "#",
    colUsername:  "Username",
    colShopName:  "Shop Name",
    colCity:      "City",
    colVerified:  "Verified",
    colJoined:    "Joined",
    colActions:   "Actions",
    colRole:      "Role",
    colContact:   "Contact",
    colSocials:   "Socials",
    colMap:       "Map",
    colStatus:    "Status",
    colAction:    "Action",

    // ── Shared confirm / buttons ──
    confirmSure:   "Sure?",
    confirmYes:    "Yes",
    confirmNo:     "No",
    cancelBtn:     "Cancel",
    saveChangesBtn:"Save Changes",
    savingBtn:     "Saving…",
    revokeBtn:     "Revoke",
    approveBtn:    "Approve",
    viewMapBtn:    "View ↗",

    // ── Admin Dashboard ──
    adminTitle:          "System Administration",
    adminSub:            "Platform analytics & performance overview",
    liveDashboard:       "Live Dashboard",
    kpiPlatformActivity: "Platform Activity",
    kpiTotalRecs:        "Total Recommendations",
    kpiRegisteredShops:  "Registered Shops",
    kpiVerifiedShops:    "Verified Shops",
    kpiPendingVerify:    "Pending Verification",
    kpiConversionFunnel: "Conversion Funnel",
    kpiImpressions:      "Total Impressions",
    kpiClicks:           "Total Clicks",
    kpiConversion:       "Platform Conversion",
    adminUsageReports:   "System Usage Reports",
    adminTopGemini:      "Top Recommended by Gemini",
    adminNoRecs:         "No recommendations yet.",
    adminTopDevices:     "Most Searched Devices",
    adminNoSearches:     "No searches yet.",
    adminTopShops:       "Top Ad-Performing Shops",
    adminNoAds:          "No shop ads served yet.",
    adminGeoTitle:       "Geographic Demand Distribution",
    adminGeoCities:      "Cities generating the most device searches.",
    adminNoCities:       "No city data yet.",
    hitsLabel:           "hits",
    searchesLabel:       "searches",
    viewsLabel:          "views",
    failedFetchAdmin:    "Failed to fetch analytics.",
    adminBudgetTitle:    "Budget Range Insights",
    adminBudgetSub:      "Price ranges users are searching in",
    adminBudgetLAK:      "LAK Searches",
    adminBudgetUSD:      "USD Searches",
    adminBudgetLowest:   "Lowest",
    adminBudgetAvg:      "Average",
    adminBudgetHighest:  "Highest",
    adminBudgetDist:     "Distribution",
    adminBudgetNoData:   "No budget data yet.",

    // ── User Management ──
    userMgmtSub:       "View, edit, and remove shopper and seller accounts",
    sellerAccounts:    "Seller Accounts",
    shopperAccounts:   "Shopper Accounts",
    totalUsers:        "Total Users",
    editUser:          "Edit User",
    usernameLabel:     "Username",
    newPasswordLabel:  "New Password",
    passwordHint:      "leave blank to keep current",
    regularUser:       "Regular User",
    noSellers:         "No seller accounts yet.",
    noShoppers:        "No shopper accounts yet.",
    userUpdatedMsg:    "User updated successfully.",
    userDeletedMsg:    "User deleted successfully.",
    loadingUsers:      "Loading users...",
    failedLoadUsers:   "Failed to load users.",
    failedDeleteUser:  "Failed to delete user.",

    // ── Shop Verification ──
    shopVerifySub:      "Approve and manage partner shop certifications",
    totalShopsLabel:    "Total Shops",
    awaitingVerify:     "Awaiting Verification",
    verifiedPartners:   "Verified Partner Shops",
    noVerifiedShops:    "No verified shops yet.",
    loadingShops:       "Loading shops...",
    failedLoadShops:    "Failed to load shops.",
    shopVerifiedMsg:    "Shop approved & verified.",
    shopRevokedMsg:     "Shop verification revoked.",
    failedVerifyShop:   "Failed to update verification status.",
    noShopsRegistered:  "No shops registered",

    // ── Saved Products / Wishlist ──
    savedProducts:      "Saved Products",
    savedTab:           "Saved",
    historyTab:         "History",
    saveProduct:        "Save",
    unsaveProduct:      "Unsave",
    noSavedProducts:    "No saved products yet. Save a product from the chatbot to see it here.",
    savedCount:         "{n} saved",

    // ── Product card new fields ──
    newerModelAlert:    "Newer model available:",
    priceDrop:          "Price drop",
    launchPriceLabel:   "Launch",
    releasedIn:         "Released",

    // ── Specs site links ──
    viewOnGsmarena:     "GSMArena",
    viewOnNotebook:     "Notebookcheck",
    viewSpecsTip:       "View photos & specs",
  },

  lo: {
    // ── Chat / App ──
    welcome:           "ສະບາຍດີ! ຂ້ອຍຊື່ Aiycom. ບອກຂ້ອຍວ່າທ່ານຕ້ອງການຫຍັງ ຫຼື ໃຊ້ຕົວຊ່ວຍຄັດເລືອກຂ້າງລຸ່ມ!",
    searching:         "ກຳລັງຄົ້ນຫາອຸປະກອນທີ່ດີທີ່ສຸດ ແລະ ຮ້ານໃກ້ຄຽງ...",
    resultIntro:       "ນີ້ຄືສິ່ງທີ່ຂ້ອຍພົບສຳລັບທ່ານ!",
    errorPrefix:       "ຂໍໂທດ, ມີຂໍ້ຜິດພາດ:",
    inputPlaceholder:  "ພິມຄຳຂໍຂອງທ່ານ...",

    // ── Landing choices ──
    helpMeChoose:      "ຊ່ວຍຂ້ອຍເລືອກ",
    helpMeChooseSub:   "ຕອບຄຳຖາມສັ້ນໆ ເພື່ອຮັບຄຳແນະນຳທີ່ເໝາະສົມ",
    typeOwn:           "ພິມຄຳຂໍຂອງທ່ານ",
    typeOwnSub:        "ອະທິບາຍສິ່ງທີ່ທ່ານຕ້ອງການໃນຊ່ອງຂ້າງລຸ່ມ",

    // ── Sidebar ──
    chatbot:           "ສົນທະນາ AI",
    history:           "ປະຫວັດ",
    shops:             "ຮ້ານຄ້າ",
    login:             "ເຂົ້າສູ່ລະບົບ / ລົງທະບຽນ",
    shopDashboard:     "ໜ້າຄວບຄຸມຮ້ານ",
    sellerPortal:      "ພອດທັລຜູ້ຂາຍ",
    adminPanel:        "ໜ້າຄວບຄຸມລະບົບ",
    logout:            "ອອກຈາກລະບົບ",

    // ── History page ──
    historyTitle:        "ປະຫວັດການຄົ້ນຫາ",
    historyEmpty:        "ຍັງບໍ່ມີການຄົ້ນຫາ. ເລີ່ມສົນທະນາໄດ້ເລີຍ!",
    historyLoginTitle:   "ປະຫວັດຂອງທ່ານເປັນສ່ວນຕົວ",
    historyLoginDesc:    "ສ້າງບັນຊີເພື່ອບັນທຶກການຄົ້ນຫາ ແລະ ກັບມາເບິ່ງຄຳແນະນຳໄດ້ທຸກເວລາ.",
    loginBtn:            "ເຂົ້າສູ່ລະບົບ",
    registerBtn:         "ລົງທະບຽນ",

    // ── Shops page ──
    shopsTitle:          "ລາຍຊື່ຮ້ານຄ້າ",
    shopsSubtitle:       "ຮ້ານທີ່ທ່ານສາມາດຊື້ອຸປະກອນທີ່ພວກເຮົາແນະນຳ",
    shopsEmpty:          "ບໍ່ພົບຮ້ານຄ້າ.",
    verified:            "ຄູ່ຮ່ວມງານທີ່ຢັ້ງຢືນ",
    pending:             "ລໍຖ້າກວດສອບ",
    viewOnMap:           "ເບິ່ງໃນແຜນທີ່",

    // ── Wizard step titles ──
    step1Title:        "ທ່ານຕ້ອງການອຸປະກອນປະເພດໃດ?",
    step2Title:        "ທ່ານຈະໃຊ້ {device} ເພື່ອຫຍັງ?",
    step3Title:        "ທ່ານມັກຍີ່ຫໍ້ໃດ?",
    step4Title:        "ທ່ານຈະໃຊ້ດົນປານໃດ?",
    step5Title:        "ງົບປະມານ & ສະຖານທີ່",

    // ── Wizard buttons / labels ──
    back:              "ກັບຄືນ",
    next:              "ຕໍ່ໄປ",
    search:            "ຄົ້ນຫາ",
    searching2:        "ກຳລັງຄົ້ນຫາ...",
    budgetLabel:          "ງົບປະມານ",
    budgetPlaceholderLAK: "ເຊັ່ນ: 5000000",
    currencyUSD:          "USD",
    currencyLAK:          "LAK",
    cityLabel:            "ເມືອງ (ສຳລັບຮ້ານໃກ້ຄຽງ)",
    cityPlaceholder:      "ເຊັ່ນ: ວຽງຈັນ, ຫຼວງພະບາງ...",
    noPreference:         "ບໍ່ມີຄວາມຕ້ອງການ",
    selectAtLeastOne:     "ເລືອກຢ່າງໜ້ອຍໜຶ່ງ",

    // ── Lifecycle options ──
    "~1 year":   "~1 ປີ",
    "2 years":   "2 ປີ",
    "3 years":   "3 ປີ",
    "4+ years":  "4+ ປີ",

    // ── Wizard device names ──
    Smartphone:        "ໂທລະສັບ",
    Tablet:            "ແທັບເລັດ",
    Laptop:            "ຄອມພິວເຕີ",

    // ── Wizard purposes ──
    "General Use":         "ໃຊ້ງານທົ່ວໄປ",
    "Photography":         "ຖ່າຍຮູບ",
    "Gaming":              "ເກມ",
    "Social Media":        "ສື່ສັງຄົມ",
    "Work & Productivity": "ການເຮັດວຽກ",
    "Entertainment":       "ຄວາມບັນເທີງ",
    "Learning & Education":"ການຮຽນຮູ້",
    "Art & Drawing":       "ສິລະປະ & ການແຕ້ມ",
    "Office & Work":       "ຫ້ອງການ & ວຽກ",
    "Student & Education": "ນັກຮຽນ & ການສຶກສາ",
    "Content Creation":    "ສ້າງເນື້ອຫາ",
    "Programming":         "ໂປຣແກຣມ",

    // ── Wizard auto-submit sentence ──
    wizardQuery:         "ແນະນຳ {device} ສຳລັບ {purposes}{brand} ງົບ {budget}{lifecycle}{city}.",
    wizardBrandPart:     " ຈາກ {brand}",
    wizardCityPart:      " ໃນ {city}",
    wizardLifecyclePart: " ໃຊ້ງານ {lifecycle}",

    // ── Compare ──
    addCompare:        "ປຽບທຽບ",
    removeCompare:     "ລຶບອອກ",
    compareSelected:   "ເລືອກ {n} ອັນ",
    compare:           "ປຽບທຽບເລີຍ",
    compareTitle:      "ຕາຕະລາງປຽບທຽບ",
    comparePrice:      "ລາຄາ",

    // ── ProductCardMini ──
    fullSpecs:         "ຂໍ້ມູນດ້ານເຕັກນິກ",
    pros:              "ຂໍ້ດີ",
    cons:              "ຂໍ້ເສຍ",
    whereToBuy:        "ຊື້ໄດ້ທີ່ໃດ",
    alternatives:      "ທາງເລືອກອື່ນ",
    moreDetails:       "ລາຍລະອຽດເພີ່ມ",
    lessDetails:       "ຫຍໍ້ລາຍລະອຽດ",
    partner:           "ຄູ່ຮ່ວມງານ",

    // ── ProductCard ──
    whyMatches:        "ເປັນຫຍັງຈຶ່ງເໝາະສົມ",
    specifications:    "ສະເປັກດ້ານເຕັກນິກ",
    whereToBuyNear:    "ຊື້ໄດ້ໃກ້ທ່ານ",
    altToConsider:     "ທາງເລືອກທີ່ຄວນພິຈາລະນາ",
    searchAgain:       "ຄົ້ນຫາອີກຄັ້ງ",
    specialFeatures:   "ຄຸນສົມບັດພິເສດ:",
    somethingWrong:    "ມີຂໍ້ຜິດພາດ",
    tryAgain:          "ລອງໃໝ່",

    // ── Spec labels ──
    specDisplay:       "ໜ້າຈໍ",
    specProcessor:     "ໂປຣເຊດເຊີ",
    specRam:           "RAM",
    specStorage:       "ພື້ນທີ່ເກັບຂໍ້ມູນ",
    specBattery:       "ແບັດເຕີລີ",
    specWeight:        "ນໍ້າໜັກ",

    // ── Wizard drill-down step ──
    stepDrilldownTitle:   "ບອກຂໍ້ມູນກ່ຽວກັບ {purpose}",
    stepPainPointsTitle:  "ທ່ານເຄີຍມີບັນຫາຫຍັງກັບອຸປະກອນ?",

    // Photography drill-down
    "photo_casual":           "ຖ່າຍຮູບທົ່ວໄປ",
    "photo_casual_sub":       "ໃຊ້ງານທຸກວັນ",
    "photo_nighttravel":      "ກາງຄືນ & ທ່ອງທ່ຽວ",
    "photo_nighttravel_sub":  "ງານ, ຖ່າຍໃນທີ່ມືດ, ທ່ອງທ່ຽວ",
    "photo_nighttravel_badge":"Optical Zoom",
    "photo_vlog":             "ວີດີໂອ & Vlog",
    "photo_vlog_sub":         "ສ້າງເນື້ອຫາ",
    "photo_vlog_badge":       "OIS + 4K Front",

    // Gaming drill-down
    "gaming_casual":           "ເກມທົ່ວໄປ",
    "gaming_casual_sub":       "ເກມ Puzzle, ງ່າຍໆ",
    "gaming_competitive":      "Competitive",
    "gaming_competitive_sub":  "PUBG, Mobile Legends",
    "gaming_competitive_badge":"90Hz+",
    "gaming_heavy3d":          "3D ໜັກ",
    "gaming_heavy3d_sub":      "Genshin Impact, COD Mobile",
    "gaming_heavy3d_badge":    "Flagship + Cooling",

    // Work drill-down
    "work_light":       "ວຽກງ່າຍ",
    "work_light_sub":   "Email, ທ່ອງເວັບ, ເອກະສານ",
    "work_power":       "ຫຼາຍໂປຣແກຣມ",
    "work_power_sub":   "ໃຊ້ຫຼາຍ Apps ພ້ອມກັນ",
    "work_power_badge": "8GB+ RAM",

    // Pain points — shared
    "pain_battery": "ແບັດໝົດໄວ",
    "pain_lag":     "ເຄື່ອງຊ້າ / ຄ້າງ",
    "pain_cracking":"ຈໍ/ໂຕ ແຕກງ່າຍ",
    "pain_storage": "ພື້ນທີ່ບໍ່ພໍ",
    "pain_camera":  "ກ້ອງບໍ່ດີ",
    // Pain points — phone extra
    "pain_heat":    "ຮ້ອນຫຼາຍ",
    // Pain points — tablet
    "pain_display": "ຈໍບໍ່ດີ / ມົວ",
    "pain_stylus":  "ການໃຊ້ Stylus ບໍ່ດີ",
    // Pain points — laptop
    "pain_build":   "ແປ້ນພິມ / ບານໜ້ານ ເສຍ",
    "pain_weight":  "ໜັກເກີນ",
    skipPainPoints: "ບໍ່ມີບັນຫາ, ຂ້າມ",

    // ── Laptop purpose drill-downs ──
    "prog_webdev":          "ພັດທະນາ Web / App",
    "prog_webdev_sub":      "Frontend, Backend, Mobile",
    "prog_datascience":     "Data Science / AI",
    "prog_datascience_sub": "ML, ວິເຄາະຂໍ້ມູນ, Notebooks",
    "prog_datascience_badge":"ຕ້ອງການ GPU",
    "prog_general":         "Coding ທົ່ວໄປ",
    "prog_general_sub":     "Scripts, ຮຽນ, ວຽກປົນ",

    "content_video":        "ຕັດຕໍ່ວິດີໂອ",
    "content_video_sub":    "4K/8K, ສີ, ສ້າງຄລິບ",
    "content_video_badge":  "ຕ້ອງການ GPU",
    "content_photo":        "ຕົກແຕ່ງຮູບພາບ",
    "content_photo_sub":    "Lightroom, Photoshop, RAW",
    "content_music":        "ຜະລິດດົນຕີ",
    "content_music_sub":    "DAW, ບັນທຶກ, Mix",

    // ── Tablet purpose drill-downs ──
    "art_pro":          "ອາດສ໌ / ດີໄຊ ລະອຽດ",
    "art_pro_sub":      "ວາດ, ກາຟິກ, ວຽກໂປ",
    "art_pro_badge":    "ຕ້ອງການ Stylus",
    "art_casual_dd":    "ວາດເຫຼັ້ນ / ຈົດໂນ້ດ",
    "art_casual_dd_sub":"ວາດງ່າຍ, ຈົດ, ແຕ້ມ",

    // ── Laptop specs step ──
    stepLaptopSpecsTitle: "ຂະໜາດຈໍ ແລະ ຄວາມສະດວກ?",
    screenCompact:        "ຂະໜາດນ້ອຍ  13–14\"",
    screenCompact_sub:    "ເບົາ, ພົກພາງ່າຍ",
    screenStandard:       "ຂະໜາດກາງ  15\"",
    screenStandard_sub:   "ສົມດຸນ",
    screenLarge:          "ຂະໜາດໃຫຍ່  16–17\"",
    screenLarge_sub:      "ຈໍກວ້າງ",
    weightUltra:          "ເບົາຫຼາຍ  < 1.5 kg",
    weightUltra_sub:      "ໄປ-ມາ, ທ່ອງທ່ຽວ",
    weightAny:            "ໜ້ຳໜັກບໍ່ສຳຄັນ",
    weightAny_sub:        "ໃສ່ໃຈ Spec ຫຼາຍກວ່າ",

    // ── Tablet specs step ──
    stepTabletSpecsTitle: "ຂະໜາດຈໍ ແລະ Stylus?",
    tabletSizeSmall:      "ນ້ອຍ  8–10\"",
    tabletSizeSmall_sub:  "ຖືໄດ້ດ້ວຍມືດຽວ",
    tabletSizeMedium:     "ກາງ  10–12\"",
    tabletSizeMedium_sub: "ດີທຸກດ້ານ",
    tabletSizeLarge:      "ໃຫຍ່  12\"+",
    tabletSizeLarge_sub:  "ໜ້າຈໍໃຫຍ່ ຄືຄອມ",
    stylusYes:            "ຕ້ອງການ Stylus",
    stylusYes_sub:        "ວາດ, ຈົດ, ເຊັນ",
    stylusNo:             "ບໍ່ຕ້ອງການ Stylus",
    stylusNo_sub:         "ເບິ່ງ Media, ທ່ອງເວັບ",

    // Brand alternator
    brandPremium:   "ຍີ່ຫໍ້ Premium",
    brandValue:     "ຄຸ້ມຄ່າທີ່ສຸດ",
    brandBestMoney: "Spec ດີທີ່ສຸດໃນງົບ",
    brandOrType:    "ຫຼື ພິມຊື່ຍີ່ຫໍ້",
    brandTypePlaceholder: "ເຊັ່ນ: Infinix, Tecno, Huawei...",

    // Post-recommendation action chips
    chipTradeoff:     "ສະຫຼຸບຂໍ້ດີ-ຂໍ້ເສຍ",
    chipCheaper:      "ຊອກທາງເລືອກຖືກກວ່າ",
    chipCompareAll:   "ປຽບທຽບທັງໝົດ",
    loadingTradeoff:  "ກຳລັງວິເຄາະ...",
    loadingCheaper:   "ກຳລັງຊອກທາງເລືອກ...",
    tradeoffTitle:    "ວິເຄາະຂໍ້ດີ-ຂໍ້ເສຍ",
    cheaperTitle:     "ທາງເລືອກໃນງົບຕ່ຳກວ່າ",

    // ── Sidebar (admin) ──
    userManagement:   "ການຈັດການຜູ້ໃຊ້",
    shopVerification: "ການຢັ້ງຢືນຮ້ານ",

    // ── Shared table columns ──
    colId:        "#",
    colUsername:  "ຊື່ຜູ້ໃຊ້",
    colShopName:  "ຊື່ຮ້ານ",
    colCity:      "ເມືອງ",
    colVerified:  "ຢັ້ງຢືນ",
    colJoined:    "ວັນລົງທະບຽນ",
    colActions:   "ດຳເນີນການ",
    colRole:      "ບົດບາດ",
    colContact:   "ຕິດຕໍ່",
    colSocials:   "ສັງຄົມ",
    colMap:       "ແຜນທີ່",
    colStatus:    "ສະຖານະ",
    colAction:    "ດຳເນີນການ",

    // ── Shared confirm / buttons ──
    confirmSure:   "ແນ່ໃຈບໍ?",
    confirmYes:    "ແມ່ນ",
    confirmNo:     "ບໍ່",
    cancelBtn:     "ຍົກເລີກ",
    saveChangesBtn:"ບັນທຶກ",
    savingBtn:     "ກຳລັງບັນທຶກ...",
    revokeBtn:     "ຖອດຖອນ",
    approveBtn:    "ອະນຸມັດ",
    viewMapBtn:    "ເບິ່ງ ↗",

    // ── Admin Dashboard ──
    adminTitle:          "ການບໍລິຫານລະບົບ",
    adminSub:            "ພາບລວມການວິເຄາະ ແລະ ປະສິດທິພາບ",
    liveDashboard:       "ໜ້າຈໍສົດ",
    kpiPlatformActivity: "ກິດຈະກໍາເວທີ",
    kpiTotalRecs:        "ຄຳແນະນຳທັງໝົດ",
    kpiRegisteredShops:  "ຮ້ານທີ່ລົງທະບຽນ",
    kpiVerifiedShops:    "ຮ້ານທີ່ຢັ້ງຢືນ",
    kpiPendingVerify:    "ລໍຖ້າຢັ້ງຢືນ",
    kpiConversionFunnel: "ຊ່ອງທາງການປ່ຽນ",
    kpiImpressions:      "ຈຳນວນການເບິ່ງທັງໝົດ",
    kpiClicks:           "ຈຳນວນຄລິກທັງໝົດ",
    kpiConversion:       "ອັດຕາການປ່ຽນ",
    adminUsageReports:   "ລາຍງານການໃຊ້ລະບົບ",
    adminTopGemini:      "ສິນຄ້າທີ່ Gemini ແນະນຳຫຼາຍສຸດ",
    adminNoRecs:         "ຍັງບໍ່ມີຄຳແນະນຳ",
    adminTopDevices:     "ອຸປະກອນທີ່ຄົ້ນຫາຫຼາຍສຸດ",
    adminNoSearches:     "ຍັງບໍ່ມີການຄົ້ນຫາ",
    adminTopShops:       "ຮ້ານໂຄສະນາດີທີ່ສຸດ",
    adminNoAds:          "ຍັງບໍ່ມີໂຄສະນາຮ້ານ",
    adminGeoTitle:       "ການກະຈາຍຄວາມຕ້ອງການຕາມພູມີສາດ",
    adminGeoCities:      "ເມືອງທີ່ຄົ້ນຫາອຸປະກອນຫຼາຍທີ່ສຸດ",
    adminNoCities:       "ຍັງບໍ່ມີຂໍ້ມູນເມືອງ",
    hitsLabel:           "ຄັ້ງ",
    searchesLabel:       "ການຄົ້ນຫາ",
    viewsLabel:          "ການເບິ່ງ",
    failedFetchAdmin:    "ໂຫຼດຂໍ້ມູນລົ້ມເຫລວ",
    adminBudgetTitle:    "ຂໍ້ມູນຊ່ວງງົບປະມານ",
    adminBudgetSub:      "ຊ່ວງລາຄາທີ່ຜູ້ໃຊ້ຄົ້ນຫາ",
    adminBudgetLAK:      "ຄົ້ນຫາດ້ວຍ LAK",
    adminBudgetUSD:      "ຄົ້ນຫາດ້ວຍ USD",
    adminBudgetLowest:   "ຕ່ຳສຸດ",
    adminBudgetAvg:      "ສະເລ່ຍ",
    adminBudgetHighest:  "ສູງສຸດ",
    adminBudgetDist:     "ການກະຈາຍ",
    adminBudgetNoData:   "ຍັງບໍ່ມີຂໍ້ມູນງົບປະມານ",

    // ── User Management ──
    userMgmtSub:       "ເບິ່ງ, ແກ້ໄຂ ແລະ ລຶບບັນຊີຜູ້ໃຊ້",
    sellerAccounts:    "ບັນຊີຜູ້ຂາຍ",
    shopperAccounts:   "ບັນຊີຜູ້ຊື້",
    totalUsers:        "ຜູ້ໃຊ້ທັງໝົດ",
    editUser:          "ແກ້ໄຂຜູ້ໃຊ້",
    usernameLabel:     "ຊື່ຜູ້ໃຊ້",
    newPasswordLabel:  "ລະຫັດຜ່ານໃໝ່",
    passwordHint:      "ຖ້າບໍ່ປ່ຽນ ປ່ອຍຫວ່າງ",
    regularUser:       "ຜູ້ໃຊ້ທົ່ວໄປ",
    noSellers:         "ຍັງບໍ່ມີບັນຊີຜູ້ຂາຍ",
    noShoppers:        "ຍັງບໍ່ມີບັນຊີຜູ້ຊື້",
    userUpdatedMsg:    "ອັບເດດຜູ້ໃຊ້ສຳເລັດ",
    userDeletedMsg:    "ລຶບຜູ້ໃຊ້ສຳເລັດ",
    loadingUsers:      "ກຳລັງໂຫຼດຜູ້ໃຊ້...",
    failedLoadUsers:   "ໂຫຼດຜູ້ໃຊ້ລົ້ມເຫລວ",
    failedDeleteUser:  "ລຶບຜູ້ໃຊ້ລົ້ມເຫລວ",

    // ── Shop Verification ──
    shopVerifySub:      "ອະນຸມັດ ແລະ ຈັດການຮ້ານຄູ່ຮ່ວມ",
    totalShopsLabel:    "ຮ້ານທັງໝົດ",
    awaitingVerify:     "ລໍຖ້າການຢັ້ງຢືນ",
    verifiedPartners:   "ຮ້ານຄູ່ຮ່ວມທີ່ຢັ້ງຢືນ",
    noVerifiedShops:    "ຍັງບໍ່ມີຮ້ານທີ່ຢັ້ງຢືນ",
    loadingShops:       "ກຳລັງໂຫຼດຮ້ານ...",
    failedLoadShops:    "ໂຫຼດຮ້ານລົ້ມເຫລວ",
    shopVerifiedMsg:    "ຮ້ານໄດ້ຮັບການຢັ້ງຢືນ",
    shopRevokedMsg:     "ຖອດຖອນການຢັ້ງຢືນຮ້ານ",
    failedVerifyShop:   "ອັບເດດສະຖານະລົ້ມເຫລວ",
    noShopsRegistered:  "ຍັງບໍ່ມີຮ້ານລົງທະບຽນ",

    // ── Saved Products / Wishlist ──
    savedProducts:      "ສິນຄ້າທີ່ບັນທຶກໄວ້",
    savedTab:           "ທີ່ບັນທຶກ",
    historyTab:         "ປະຫວັດ",
    saveProduct:        "ບັນທຶກ",
    unsaveProduct:      "ລຶບອອກ",
    noSavedProducts:    "ຍັງບໍ່ມີສິນຄ້າທີ່ບັນທຶກໄວ້. ບັນທຶກສິນຄ້າຈາກ Chatbot ເພື່ອສະແດງທີ່ນີ້.",
    savedCount:         "ບັນທຶກ {n} ອັນ",

    // ── Product card new fields ──
    newerModelAlert:    "ມີລຸ້ນໃໝ່:",
    priceDrop:          "ລາຄາຫຼຸດ",
    launchPriceLabel:   "ລາຄາເປີດໂຕ",
    releasedIn:         "ປ່ອຍ",

    // ── Specs site links ──
    viewOnGsmarena:     "GSMArena",
    viewOnNotebook:     "Notebookcheck",
    viewSpecsTip:       "ເບິ່ງຮູບ & ສະເປັກ",
  },
};

export function t(key, lang = "en") {
  return strings[lang]?.[key] ?? strings["en"]?.[key] ?? key;
}
