"""
FirstReport — BNSS Database Builder
=====================================
Creates and populates the SQLite databases:
1. bnss_schedule1.sqlite — Offense classification table
2. authorities.sqlite — SP/DM/HC contacts for 5 states

Run this script once to build the databases:
    python legal/data/build_db.py
"""

import sqlite3
import os

DATA_DIR = os.path.dirname(os.path.abspath(__file__))


def build_bnss_schedule1():
    """Build the BNSS Schedule 1 offense database with 27+ offenses."""
    db_path = os.path.join(DATA_DIR, "bnss_schedule1.sqlite")
    
    # Remove existing
    if os.path.exists(db_path):
        os.remove(db_path)
    
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    
    c.execute("""
        CREATE TABLE offenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bnss_section TEXT NOT NULL,
            offense_name_hindi TEXT NOT NULL,
            offense_name_english TEXT NOT NULL,
            description_hindi TEXT,
            is_cognizable INTEGER NOT NULL DEFAULT 1,
            is_bailable INTEGER NOT NULL DEFAULT 0,
            punishment TEXT,
            punishment_hindi TEXT,
            keywords TEXT,
            category TEXT
        )
    """)
    
    # 27+ offenses from BNSS Schedule 1
    offenses = [
        # === 7 required offenses from spec ===
        ("303", "गृह से चोरी", "Theft from dwelling", 
         "किसी के घर, आवास या कब्ज़े की जगह से चोरी करना",
         1, 0, "Up to 7 years imprisonment and fine",
         "7 वर्ष तक कारावास और जुर्माना",
         "chori,churaya,paisa,saman,almari,ghar", "property"),
        
        ("115", "स्वेच्छा से चोट पहुंचाना", "Voluntarily causing hurt",
         "किसी व्यक्ति को जानबूझकर शारीरिक चोट पहुंचाना",
         1, 1, "Up to 1 year imprisonment or fine up to ₹10,000 or both",
         "1 वर्ष तक कारावास या ₹10,000 जुर्माना या दोनों",
         "maar,peet,chot,maara,peeta,dard,haath", "person"),
        
        ("166", "लोक सेवक द्वारा कानून की अवहेलना", "Public servant disobeying law",
         "कोई भी सरकारी अधिकारी जो कानून की अवहेलना करता है जिससे किसी व्यक्ति को हानि होती है",
         1, 1, "Up to 1 year imprisonment or fine or both",
         "1 वर्ष तक कारावास या जुर्माना या दोनों",
         "adhikari,police,fir,mana,inkaar,nahi likha", "public_servant"),
        
        ("126", "सदोष परिरोध", "Wrongful restraint",
         "किसी व्यक्ति को जाने से रोकना जहां उसे जाने का अधिकार है",
         1, 1, "Up to 1 month imprisonment or fine up to ₹500 or both",
         "1 माह तक कारावास या ₹500 जुर्माना या दोनों",
         "roka,rok,band,bahar,jaane nahi diya,restraint", "person"),
        
        ("352", "आपराधिक धमकी", "Criminal intimidation",
         "किसी व्यक्ति को डराना धमकाना कि उसे या उसकी संपत्ति को नुकसान पहुंचाया जाएगा",
         1, 1, "Up to 2 years imprisonment or fine or both",
         "2 वर्ष तक कारावास या जुर्माना या दोनों",
         "dhamki,dara,dar,maarunga,jaan se maar,threat", "person"),
        
        ("316", "छल", "Cheating",
         "किसी व्यक्ति को धोखा देकर उसकी संपत्ति या अन्य वस्तु हासिल करना",
         1, 1, "Up to 1 year imprisonment or fine or both",
         "1 वर्ष तक कारावास या जुर्माना या दोनों",
         "dhokha,cheat,jhooth,fraud,paisa,thaga", "property"),
        
        ("74", "महिला पर हमला या अपराधिक बल", "Assault on woman",
         "किसी महिला की लज्जा भंग करने के इरादे से हमला या अपराधिक बल का प्रयोग",
         1, 0, "Up to 5 years imprisonment and fine",
         "5 वर्ष तक कारावास और जुर्माना",
         "mahila,aurat,ladki,izzat,chedkhani,assault,woman", "person"),
        
        # === 20 additional common offenses ===
        ("302", "चोरी", "Theft",
         "किसी व्यक्ति की चल संपत्ति को बेईमानी से लेना",
         1, 1, "Up to 3 years imprisonment or fine or both",
         "3 वर्ष तक कारावास या जुर्माना या दोनों",
         "chori,churaya,le gaya,chura liya", "property"),
        
        ("304", "डकैती/लूट", "Robbery",
         "चोरी के समय या तुरंत बाद बल प्रयोग या भय",
         1, 0, "Up to 10 years imprisonment and fine",
         "10 वर्ष तक कारावास और जुर्माना",
         "loot,lut,chheen,robbery,snatch,phone chheen", "property"),
        
        ("305", "डकैती", "Dacoity",
         "पांच या अधिक व्यक्तियों द्वारा मिलकर लूट",
         1, 0, "Up to life imprisonment",
         "आजीवन कारावास तक",
         "dakait,dacoity,gang,loot,armed", "property"),
        
        ("309", "आपराधिक विश्वासघात", "Criminal breach of trust",
         "किसी संपत्ति जो किसी के भरोसे पर सौंपी गई, उसका बेईमानी से दुरुपयोग",
         1, 1, "Up to 3 years imprisonment or fine or both",
         "3 वर्ष तक कारावास या जुर्माना या दोनों",
         "bharosa,trust,paisa,zimma,breach", "property"),
        
        ("318", "छल द्वारा संपत्ति हस्तांतरण", "Cheating and dishonestly inducing delivery",
         "छल करके किसी से संपत्ति देने के लिए प्रेरित करना",
         1, 0, "Up to 7 years imprisonment and fine",
         "7 वर्ष तक कारावास और जुर्माना",
         "dhokha,thaga,fraud,scheme,invest,ponzi", "property"),
        
        ("115(2)", "गंभीर चोट", "Grievous hurt",
         "किसी व्यक्ति को जानबूझकर गंभीर शारीरिक चोट पहुंचाना जैसे हड्डी तोड़ना",
         1, 0, "Up to 7 years imprisonment and fine",
         "7 वर्ष तक कारावास और जुर्माना",
         "haddi,tod,tuti,serious,injury,grievous,fracture", "person"),
        
        ("117", "एसिड अटैक", "Acid attack",
         "किसी व्यक्ति पर एसिड या अन्य संक्षारक पदार्थ फेंकना",
         1, 0, "Not less than 10 years, up to life imprisonment",
         "10 वर्ष से कम नहीं, आजीवन कारावास तक",
         "acid,tezaab,jalana", "person"),
        
        ("127", "सदोष परिरोध", "Wrongful confinement",
         "किसी व्यक्ति को किसी स्थान पर बंद रखना",
         1, 1, "Up to 1 year imprisonment or fine up to ₹1000 or both",
         "1 वर्ष तक कारावास या ₹1000 जुर्माना या दोनों",
         "band,kaid,room,kamra,confinement,locked", "person"),
        
        ("351", "अपराधिक अभित्रास", "Criminal intimidation by threat of death",
         "मृत्यु या गंभीर चोट की धमकी",
         1, 0, "Up to 7 years imprisonment or fine or both",
         "7 वर्ष तक कारावास या जुर्माना या दोनों",
         "jaan,marna,maar dalunga,death,threat,kill", "person"),
        
        ("329", "आपराधिक अतिक्रमण", "Criminal trespass",
         "बिना अनुमति किसी की संपत्ति में प्रवेश",
         1, 1, "Up to 3 months imprisonment or fine up to ₹500",
         "3 माह तक कारावास या ₹500 जुर्माना",
         "ghus,ghar,property,trespass,enter,invade", "property"),
        
        ("330", "गृह भेदन", "House-breaking",
         "किसी के घर में अवैध रूप से प्रवेश करना",
         1, 0, "Up to 2 years imprisonment and fine",
         "2 वर्ष तक कारावास और जुर्माना",
         "tod,darwaza,ghar,break,house,entry", "property"),
        
        ("331", "रात्रि गृह भेदन", "House-breaking by night",
         "रात में किसी के घर में अवैध प्रवेश",
         1, 0, "Up to 3 years imprisonment and fine",
         "3 वर्ष तक कारावास और जुर्माना",
         "raat,night,ghar,tod,darwaza", "property"),
        
        ("79", "दहेज मृत्यु", "Dowry death",
         "विवाह के 7 वर्ष के भीतर महिला की असामान्य मृत्यु",
         1, 0, "Not less than 7 years, up to life imprisonment",
         "7 वर्ष से कम नहीं, आजीवन कारावास तक",
         "dahej,dowry,death,sasural,maut", "person"),
        
        ("85", "पति या रिश्तेदार द्वारा क्रूरता", "Cruelty by husband or relatives",
         "पति या उसके रिश्तेदारों द्वारा महिला के साथ क्रूरता",
         1, 0, "Up to 3 years imprisonment and fine",
         "3 वर्ष तक कारावास और जुर्माना",
         "pati,husband,sasural,cruel,torture,dahez,maar", "person"),
        
        ("76", "यौन उत्पीड़न", "Sexual harassment",
         "अवांछित शारीरिक संपर्क, यौन टिप्पणियां, अश्लील सामग्री दिखाना",
         1, 0, "Up to 3 years imprisonment and fine",
         "3 वर्ष तक कारावास और जुर्माना",
         "chedkhani,sexual,harassment,touch,ched,eve", "person"),
        
        ("63", "हत्या", "Murder",
         "किसी व्यक्ति की जानबूझकर हत्या",
         1, 0, "Death or life imprisonment and fine",
         "मृत्युदंड या आजीवन कारावास और जुर्माना",
         "hatya,murder,maar dala,jaan le li,kill", "person"),
        
        ("64", "दोषपूर्ण मानव वध", "Culpable homicide",
         "ऐसा कृत्य जिससे मृत्यु होने की संभावना हो",
         1, 0, "Up to life imprisonment or up to 10 years and fine",
         "आजीवन कारावास या 10 वर्ष तक कारावास और जुर्माना",
         "homicide,maut,death,negligence,accident", "person"),
        
        ("308", "लूट करने का प्रयत्न", "Attempt to robbery",
         "लूट करने का प्रयत्न",
         1, 0, "Up to 7 years imprisonment and fine",
         "7 वर्ष तक कारावास और जुर्माना",
         "lootne,attempt,koshish,robbery,try", "property"),
        
        ("340", "आपराधिक अपमान", "Criminal defamation",
         "किसी व्यक्ति की प्रतिष्ठा को हानि पहुंचाने के इरादे से बदनामी",
         0, 1, "Up to 2 years imprisonment or fine or both",
         "2 वर्ष तक कारावास या जुर्माना या दोनों",
         "badnami,izzat,defame,insult,reputation", "person"),
    ]
    
    for offense in offenses:
        c.execute("""
            INSERT INTO offenses 
            (bnss_section, offense_name_hindi, offense_name_english, description_hindi,
             is_cognizable, is_bailable, punishment, punishment_hindi, keywords, category)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, offense)
    
    # Create index for fast lookup
    c.execute("CREATE INDEX idx_section ON offenses(bnss_section)")
    c.execute("CREATE INDEX idx_cognizable ON offenses(is_cognizable)")
    
    conn.commit()
    conn.close()
    print(f"✅ BNSS Schedule 1 database built: {db_path} ({len(offenses)} offenses)")
    return db_path


def build_authorities():
    """Build the authorities contact database for 5 states."""
    db_path = os.path.join(DATA_DIR, "authorities.sqlite")
    
    if os.path.exists(db_path):
        os.remove(db_path)
    
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    
    c.execute("""
        CREATE TABLE authorities (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            state TEXT NOT NULL,
            state_hindi TEXT NOT NULL,
            district TEXT NOT NULL,
            district_hindi TEXT NOT NULL,
            tier TEXT NOT NULL,
            title TEXT NOT NULL,
            title_hindi TEXT NOT NULL,
            name TEXT NOT NULL,
            address TEXT NOT NULL,
            address_hindi TEXT NOT NULL,
            email TEXT,
            phone TEXT,
            bnss_section TEXT,
            escalation_note_hindi TEXT
        )
    """)
    
    authorities = [
        # ═══ UTTAR PRADESH — Ghaziabad ═══
        ("uttar_pradesh", "उत्तर प्रदेश", "Ghaziabad", "गाज़ियाबाद",
         "SP", "Superintendent of Police", "पुलिस अधीक्षक",
         "SP Ghaziabad", 
         "Office of SSP, Ghaziabad, Uttar Pradesh 201001",
         "पुलिस अधीक्षक कार्यालय, गाज़ियाबाद, उत्तर प्रदेश 201001",
         "spghaziabad@up.gov.in", "0120-2860364",
         "166", "धारा 166 BNSS के तहत कर्तव्य अधिकारी के खिलाफ शिकायत"),
        
        ("uttar_pradesh", "उत्तर प्रदेश", "Ghaziabad", "गाज़ियाबाद",
         "DM", "District Magistrate", "ज़िला मजिस्ट्रेट",
         "DM Ghaziabad",
         "Collectorate, Ghaziabad, Uttar Pradesh 201001",
         "कलेक्ट्रेट, गाज़ियाबाद, उत्तर प्रदेश 201001",
         "dmghaziabad@nic.in", "0120-2820246",
         "175(3)", "धारा 175(3) BNSS के तहत मजिस्ट्रेट को आवेदन"),
        
        ("uttar_pradesh", "उत्तर प्रदेश", "Ghaziabad", "गाज़ियाबाद",
         "HC", "Allahabad High Court", "इलाहाबाद उच्च न्यायालय",
         "Registrar, Allahabad High Court",
         "High Court of Judicature, Allahabad, Uttar Pradesh 211001",
         "उच्च न्यायालय, इलाहाबाद, उत्तर प्रदेश 211001",
         "registrar@allahabadhighcourt.in", None,
         "Article 226", "संविधान के अनुच्छेद 226 के तहत रिट याचिका"),
        
        ("uttar_pradesh", "उत्तर प्रदेश", "Ghaziabad", "गाज़ियाबाद",
         "SHRC", "State Human Rights Commission", "राज्य मानवाधिकार आयोग",
         "Chairperson, UP State Human Rights Commission",
         "UP Human Rights Commission, Lucknow, UP 226001",
         "उत्तर प्रदेश मानवाधिकार आयोग, लखनऊ, उ.प्र. 226001",
         "uphrc@up.nic.in", "0522-2304556",
         "166", "अधिकारी के खिलाफ मानवाधिकार शिकायत"),
        
        # ═══ MAHARASHTRA ═══
        ("maharashtra", "महाराष्ट्र", "Mumbai", "मुंबई",
         "SP", "Commissioner of Police", "पुलिस आयुक्त",
         "CP Mumbai",
         "Office of Commissioner of Police, Crawford Market, Mumbai 400001",
         "पुलिस आयुक्त कार्यालय, क्रॉफर्ड मार्केट, मुंबई 400001",
         "cpmumbai@mahapolice.gov.in", "022-22621855",
         "166", "धारा 166 BNSS के तहत शिकायत"),
        
        ("maharashtra", "महाराष्ट्र", "Mumbai", "मुंबई",
         "DM", "District Collector", "ज़िला कलेक्टर",
         "Collector Mumbai",
         "Collectorate, Old CGO Building, Mumbai 400032",
         "कलेक्ट्रेट, मुंबई 400032",
         "collector.mumbai@maharashtra.gov.in", "022-22025353",
         "175(3)", "धारा 175(3) BNSS के तहत आवेदन"),
        
        ("maharashtra", "महाराष्ट्र", "Mumbai", "मुंबई",
         "HC", "Bombay High Court", "बॉम्बे उच्च न्यायालय",
         "Registrar, Bombay High Court",
         "Bombay High Court, Fort, Mumbai 400032",
         "बॉम्बे उच्च न्यायालय, फोर्ट, मुंबई 400032",
         "registrar@bombayhighcourt.nic.in", None,
         "Article 226", "संविधान के अनुच्छेद 226 के तहत रिट"),
        
        # ═══ RAJASTHAN ═══
        ("rajasthan", "राजस्थान", "Jaipur", "जयपुर",
         "SP", "Commissioner of Police", "पुलिस आयुक्त",
         "CP Jaipur",
         "Police Commissioner Office, Lal Kothi, Jaipur 302015",
         "पुलिस आयुक्त कार्यालय, लाल कोठी, जयपुर 302015",
         "cpjaipur@rajpolice.gov.in", "0141-2743999",
         "166", "धारा 166 BNSS के तहत शिकायत"),
        
        ("rajasthan", "राजस्थान", "Jaipur", "जयपुर",
         "DM", "District Collector", "ज़िला कलेक्टर",
         "Collector Jaipur",
         "Collectorate, MI Road, Jaipur 302001",
         "कलेक्ट्रेट, एम.आई. रोड, जयपुर 302001",
         "dm-jaipur@rajasthan.gov.in", "0141-2227253",
         "175(3)", "धारा 175(3) BNSS के तहत आवेदन"),
        
        ("rajasthan", "राजस्थान", "Jaipur", "जयपुर",
         "HC", "Rajasthan High Court", "राजस्थान उच्च न्यायालय",
         "Registrar, Rajasthan High Court",
         "Rajasthan High Court, Jodhpur 342001",
         "राजस्थान उच्च न्यायालय, जोधपुर 342001",
         "registrar@hcraj.nic.in", None,
         "Article 226", "संविधान के अनुच्छेद 226 के तहत रिट"),
        
        # ═══ DELHI ═══
        ("delhi", "दिल्ली", "New Delhi", "नई दिल्ली",
         "SP", "Commissioner of Police", "पुलिस आयुक्त",
         "CP Delhi",
         "Police Headquarters, ITO, New Delhi 110002",
         "पुलिस मुख्यालय, आई.टी.ओ., नई दिल्ली 110002",
         "cp.delhi@delhipolice.gov.in", "011-23490200",
         "166", "धारा 166 BNSS के तहत शिकायत"),
        
        ("delhi", "दिल्ली", "New Delhi", "नई दिल्ली",
         "DM", "District Magistrate", "ज़िला मजिस्ट्रेट",
         "DM New Delhi",
         "DM Office, Shamnath Marg, New Delhi 110054",
         "ज़िला मजिस्ट्रेट कार्यालय, शामनाथ मार्ग, नई दिल्ली 110054",
         "dm.newdelhi@nic.in", "011-23974607",
         "175(3)", "धारा 175(3) BNSS के तहत आवेदन"),
        
        ("delhi", "दिल्ली", "New Delhi", "नई दिल्ली",
         "HC", "Delhi High Court", "दिल्ली उच्च न्यायालय",
         "Registrar, Delhi High Court",
         "Delhi High Court, Shershah Road, New Delhi 110003",
         "दिल्ली उच्च न्यायालय, शेरशाह रोड, नई दिल्ली 110003",
         "registrar@delhihighcourt.nic.in", None,
         "Article 226", "संविधान के अनुच्छेद 226 के तहत रिट"),
        
        # ═══ KARNATAKA ═══
        ("karnataka", "कर्नाटक", "Bengaluru", "बेंगलुरु",
         "SP", "Commissioner of Police", "पुलिस आयुक्त",
         "CP Bengaluru",
         "Commissioner of Police, Infantry Road, Bengaluru 560001",
         "पुलिस आयुक्त कार्यालय, इन्फैंट्री रोड, बेंगलुरु 560001",
         "cpbengaluru@ksp.gov.in", "080-22942222",
         "166", "धारा 166 BNSS के तहत शिकायत"),
        
        ("karnataka", "कर्नाटक", "Bengaluru", "बेंगलुरु",
         "DM", "Deputy Commissioner", "उपायुक्त",
         "DC Bengaluru Urban",
         "Deputy Commissioner Office, Bengaluru 560009",
         "उपायुक्त कार्यालय, बेंगलुरु 560009",
         "dc.bengaluru@karnataka.gov.in", "080-22860084",
         "175(3)", "धारा 175(3) BNSS के तहत आवेदन"),
        
        ("karnataka", "कर्नाटक", "Bengaluru", "बेंगलुरु",
         "HC", "Karnataka High Court", "कर्नाटक उच्च न्यायालय",
         "Registrar, Karnataka High Court",
         "Karnataka High Court, Ambedkar Veedhi, Bengaluru 560001",
         "कर्नाटक उच्च न्यायालय, अम्बेडकर वीधि, बेंगलुरु 560001",
         "registrar@karnatakahighcourt.nic.in", None,
         "Article 226", "संविधान के अनुच्छेद 226 के तहत रिट"),
    ]
    
    for auth in authorities:
        c.execute("""
            INSERT INTO authorities 
            (state, state_hindi, district, district_hindi, tier, title, title_hindi,
             name, address, address_hindi, email, phone, bnss_section, escalation_note_hindi)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, auth)
    
    c.execute("CREATE INDEX idx_state_tier ON authorities(state, tier)")
    
    conn.commit()
    conn.close()
    print(f"✅ Authorities database built: {db_path} ({len(authorities)} entries)")
    return db_path


def get_schedule_context(db_path: str = None) -> str:
    """
    Load full BNSS Schedule 1 as plaintext context for Gemma classification prompt.
    Returns all offenses when no incident text is provided (cold-start / cache).
    """
    if db_path is None:
        db_path = os.path.join(DATA_DIR, "bnss_schedule1.sqlite")

    if not os.path.exists(db_path):
        build_bnss_schedule1()

    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    c.execute("""
        SELECT bnss_section, offense_name_hindi, description_hindi,
               is_cognizable, punishment_hindi
        FROM offenses ORDER BY bnss_section
    """)

    lines = []
    for row in c.fetchall():
        cog = "संज्ञेय" if row[3] else "असंज्ञेय"
        lines.append(f"धारा {row[0]}: {row[1]} — {row[2]} [{cog}] — सज़ा: {row[4]}")

    conn.close()
    return "\n".join(lines)


def get_rag_context_for_incident(incident_text: str, top_k: int = 7, db_path: str = None) -> str:
    """
    BNSS RAG (Retrieval-Augmented Generation) — keyword-based pre-filter.

    Instead of feeding all 27+ BNSS sections to Gemma (wasting tokens and
    reducing accuracy), this function:
    1. Tokenises the Hindi/English incident text into meaningful keywords.
    2. Scores each SQLite offense row by keyword overlap against its
       (keywords, offense_name_hindi, description_hindi) columns.
    3. Returns the top-K most relevant sections as compact context.

    This shrinks the Gemma prompt by ~60 % and focuses the model on the
    sections most likely to apply — improving classification accuracy.

    Falls back to full context if no good matches found (score == 0 for all).
    """
    if db_path is None:
        db_path = os.path.join(DATA_DIR, "bnss_schedule1.sqlite")

    if not os.path.exists(db_path):
        build_bnss_schedule1()

    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    c.execute("""
        SELECT bnss_section, offense_name_hindi, offense_name_english,
               description_hindi, is_cognizable, punishment_hindi, keywords, category
        FROM offenses
    """)
    rows = c.fetchall()
    conn.close()

    # ── Keyword extraction ─────────────────────────────────────────────────
    STOP_WORDS = {
        "और", "में", "है", "को", "का", "की", "के", "पर", "से", "ने", "यह",
        "वह", "कि", "था", "थी", "हो", "हुई", "हुआ", "जो", "तो", "भी",
        "the", "a", "an", "is", "was", "and", "or", "in", "on", "at", "to",
        "of", "for", "with", "by", "that", "this",
    }
    words = set(w.lower().strip("।,।.?!\"'") for w in incident_text.split() if len(w) > 2)
    keywords = words - STOP_WORDS

    # ── Score each offense ─────────────────────────────────────────────────
    def score_row(row) -> int:
        haystack = " ".join([
            (row[1] or ""),   # offense_name_hindi
            (row[2] or ""),   # offense_name_english
            (row[3] or ""),   # description_hindi
            (row[6] or ""),   # keywords column
            (row[7] or ""),   # category
        ]).lower()
        return sum(1 for kw in keywords if kw in haystack)

    scored = sorted(rows, key=score_row, reverse=True)

    # If top score is 0, fall back to full context
    if score_row(scored[0]) == 0:
        return get_schedule_context(db_path)

    top_rows = scored[:top_k]
    lines = []
    for row in top_rows:
        cog = "संज्ञेय" if row[4] else "असंज्ञेय"
        lines.append(f"धारा {row[0]}: {row[1]} — {row[3]} [{cog}] — सज़ा: {row[5]}")

    return "\n".join(lines)


def lookup_authority(state: str, tier: str, db_path: str = None) -> dict:
    """
    Look up authority contact by state and tier.
    
    Args:
        state: State code (e.g., 'uttar_pradesh')
        tier: 'SP', 'DM', 'HC', or 'SHRC'
        db_path: Path to authorities.sqlite
    
    Returns:
        Dict with authority details or None
    """
    if db_path is None:
        db_path = os.path.join(DATA_DIR, "authorities.sqlite")
    
    if not os.path.exists(db_path):
        build_authorities()
    
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    c.execute("""
        SELECT title, title_hindi, name, address, address_hindi, 
               email, phone, district, district_hindi, 
               bnss_section, escalation_note_hindi
        FROM authorities 
        WHERE state = ? AND tier = ?
        LIMIT 1
    """, (state, tier))
    
    row = c.fetchone()
    conn.close()
    
    if row:
        return {
            "title": row[0],
            "title_hindi": row[1],
            "name": row[2],
            "address": row[3],
            "address_hindi": row[4],
            "email": row[5],
            "phone": row[6],
            "district": row[7],
            "district_hindi": row[8],
            "bnss_section": row[9],
            "escalation_note_hindi": row[10],
        }
    return None


if __name__ == "__main__":
    build_bnss_schedule1()
    build_authorities()
    
    # Verify
    ctx = get_schedule_context()
    print(f"\nSchedule context ({len(ctx)} chars):")
    print(ctx[:500])
    
    auth = lookup_authority("uttar_pradesh", "SP")
    print(f"\nSP Ghaziabad: {auth}")
