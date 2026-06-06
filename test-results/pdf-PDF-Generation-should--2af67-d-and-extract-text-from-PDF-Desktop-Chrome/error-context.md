# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: pdf.spec.ts >> PDF Generation >> should generate, download, and extract text from PDF
- Location: tests/e2e/pdf.spec.ts:9:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('button:has-text("Start")').first()

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - banner [ref=e3]:
    - button "Open menu" [ref=e4]
    - link "FirstReport" [ref=e5] [cursor=pointer]:
      - /url: /home
      - generic "FirstReport" [ref=e6]:
        - img [ref=e7]
        - generic [ref=e13]: FirstReport
    - generic [ref=e14]:
      - button "भाषा बदलें" [ref=e16]:
        - text: हिन्दी
        - img [ref=e17]
      - link "NALSA · 15100" [ref=e19] [cursor=pointer]:
        - /url: tel:15100
        - text: NALSA · 15100
  - complementary [ref=e20]:
    - navigation [ref=e21]:
      - link "होमहोम" [ref=e22] [cursor=pointer]:
        - /url: /home
        - img [ref=e24]
        - text: होमहोम
      - link "इतिहासइतिहास" [ref=e26] [cursor=pointer]:
        - /url: /history
        - img [ref=e28]
        - text: इतिहासइतिहास
      - button "New Report" [ref=e31]:
        - img [ref=e33]
        - text: New Report
    - button "सेटिंग्ससेटिंग्स" [ref=e36]:
      - img [ref=e38]
      - text: सेटिंग्ससेटिंग्स
  - complementary "सेटिंग्स" [ref=e41]:
    - generic [ref=e42]:
      - generic [ref=e43]:
        - heading "सेटिंग्स" [level=2] [ref=e44]
        - button "Listen" [ref=e45]:
          - img
      - button "Close" [ref=e47]:
        - img
    - generic [ref=e49]:
      - generic [ref=e50]:
        - generic [ref=e51]:
          - heading "प्रोफ़ाइल" [level=3] [ref=e52]
          - button "Listen" [ref=e53]:
            - img
        - generic [ref=e55]:
          - generic [ref=e56]:
            - text: आपका नाम (वैकल्पिक)
            - button "Listen" [ref=e57]:
              - img
          - generic [ref=e59]:
            - textbox "नाम दर्ज करें" [ref=e60]
            - button "Hold to speak your name" [ref=e61]:
              - img
        - generic [ref=e66]:
          - generic [ref=e67]:
            - generic [ref=e68]:
              - text: माइक्रोफ़ोन जाँचें
              - button "Listen" [ref=e69]:
                - img
            - paragraph [ref=e71]: बोलें और सुनें
          - img [ref=e72]
      - generic [ref=e76]:
        - generic [ref=e77]:
          - heading "भाषा प्राथमिकता" [level=3] [ref=e78]
          - button "Listen" [ref=e79]:
            - img
        - generic [ref=e81]:
          - button "हिन्दीHindi Listen" [ref=e82]:
            - text: हिन्दीHindi
            - button "Listen" [ref=e84]:
              - img
          - button "EnglishEnglish Listen" [ref=e86]:
            - text: EnglishEnglish
            - button "Listen" [ref=e88]:
              - img
          - button "বাংলাBengali Listen" [ref=e90]:
            - text: বাংলাBengali
            - button "Listen" [ref=e92]:
              - img
          - button "தமிழ்Tamil Listen" [ref=e94]:
            - text: தமிழ்Tamil
            - button "Listen" [ref=e96]:
              - img
          - button "తెలుగుTelugu Listen" [ref=e98]:
            - text: తెలుగుTelugu
            - button "Listen" [ref=e100]:
              - img
          - button "मराठीMarathi Listen" [ref=e102]:
            - text: मराठीMarathi
            - button "Listen" [ref=e104]:
              - img
          - button "ગુજરાતીGujarati Listen" [ref=e106]:
            - text: ગુજરાતીGujarati
            - button "Listen" [ref=e108]:
              - img
          - button "ಕನ್ನಡKannada Listen" [ref=e110]:
            - text: ಕನ್ನಡKannada
            - button "Listen" [ref=e112]:
              - img
          - button "മലയാളംMalayalam Listen" [ref=e114]:
            - text: മലയാളംMalayalam
            - button "Listen" [ref=e116]:
              - img
          - button "ਪੰਜਾਬੀPunjabi Listen" [ref=e118]:
            - text: ਪੰਜਾਬੀPunjabi
            - button "Listen" [ref=e120]:
              - img
          - button "ଓଡ଼ିଆOdia Listen" [ref=e122]:
            - text: ଓଡ଼ିଆOdia
            - button "Listen" [ref=e124]:
              - img
      - generic [ref=e126]:
        - generic [ref=e127]:
          - heading "आवाज़ सेटिंग्स" [level=3] [ref=e128]
          - button "Listen" [ref=e129]:
            - img
        - generic [ref=e131]:
          - generic [ref=e132]:
            - generic [ref=e133]:
              - generic [ref=e134]:
                - text: ऑटो बोलना
                - button "Listen" [ref=e135]:
                  - img
              - paragraph [ref=e137]: AI के जवाब अपने आप बोले जाएँगे
            - switch [checked] [ref=e138]
          - generic [ref=e139]:
            - generic [ref=e140]:
              - generic [ref=e141]:
                - text: ऑफ़लाइन आवाज़
                - button "Listen" [ref=e142]:
                  - img
              - paragraph [ref=e144]: इंटरनेट न हो तो डिवाइस की आवाज़ इस्तेमाल होगी
            - switch [checked] [ref=e145]
      - generic [ref=e146]:
        - generic [ref=e147]:
          - heading "Delivery & Privacy" [level=3] [ref=e148]
          - button "Listen" [ref=e149]:
            - img
        - generic [ref=e151]:
          - generic [ref=e152]:
            - generic [ref=e153]:
              - generic [ref=e154]:
                - text: टेलीग्राम सूचना
                - button "Listen" [ref=e155]:
                  - img
              - paragraph [ref=e157]: दस्तावेज़ तैयार होने पर टेलीग्राम पर भेजें
            - switch [checked] [ref=e158]
          - generic [ref=e159]:
            - generic [ref=e160]:
              - generic [ref=e161]:
                - text: AI प्रशिक्षण से बाहर
                - button "Listen" [ref=e162]:
                  - img
              - paragraph [ref=e164]: आपकी बातचीत AI सुधार के लिए इस्तेमाल नहीं होगी
            - switch [ref=e165]
      - generic [ref=e166]:
        - generic [ref=e167]:
          - heading "Data" [level=3] [ref=e168]
          - button "Listen" [ref=e169]:
            - img
        - generic [ref=e172]:
          - generic [ref=e173]:
            - generic [ref=e174]:
              - text: इतिहास मिटाएं
              - button "Listen" [ref=e175]:
                - img
            - paragraph [ref=e177]: Remove all past cases from this device.
          - button "इतिहास मिटाएं" [ref=e178]
      - generic [ref=e179]:
        - generic [ref=e180]:
          - heading "ऐप के बारे में" [level=3] [ref=e181]
          - button "Listen" [ref=e182]:
            - img
        - generic [ref=e184]:
          - generic "FirstReport — AI Legal Aid" [ref=e185]:
            - img [ref=e186]
            - generic [ref=e191]:
              - generic [ref=e192]: FirstReport
              - generic [ref=e193]: AI Legal Aid
          - generic [ref=e194]:
            - generic [ref=e195]: Version 1.0 · Gemma 4 · Sarvam AI
            - generic [ref=e196]: BNSS 2023 · POCSO · PWDVA · MWPSC · DPDP 2023
            - generic [ref=e197]: AI legal aid — not a substitute for a licensed lawyer.
          - link "NALSA Helpline · 15100" [ref=e198] [cursor=pointer]:
            - /url: tel:15100
            - text: NALSA Helpline · 15100
    - button "सेटिंग्स सहेजें" [ref=e200]
  - main [ref=e201]:
    - generic [ref=e202]:
      - main [ref=e203]:
        - generic [ref=e204]:
          - generic [ref=e205]:
            - generic [ref=e206]:
              - generic [ref=e207]: Voice-First Legal Aid
              - heading "आपकी आवाज़" [level=1] [ref=e208]
              - paragraph [ref=e209]: भाषा चुनें → मोड चुनें → शुरू करें.
            - generic [ref=e210]:
              - generic [ref=e211]:
                - text: "1"
                - heading "भाषा चुनें" [level=2] [ref=e212]
              - generic [ref=e213]:
                - button "hi-IN Listen हिन्दी Hindi" [pressed] [ref=e214]:
                  - generic [ref=e215]:
                    - text: hi-IN
                    - button "Listen" [ref=e218]:
                      - img
                  - generic [ref=e220]:
                    - generic [ref=e221]: हिन्दी
                    - generic [ref=e222]: Hindi
                - button "en-IN Listen English English" [ref=e223]:
                  - generic [ref=e224]:
                    - text: en-IN
                    - button "Listen" [ref=e227]:
                      - img
                  - generic [ref=e229]:
                    - generic [ref=e230]: English
                    - generic [ref=e231]: English
                - button "bn-IN Listen বাংলা Bengali" [ref=e232]:
                  - generic [ref=e233]:
                    - text: bn-IN
                    - button "Listen" [ref=e236]:
                      - img
                  - generic [ref=e238]:
                    - generic [ref=e239]: বাংলা
                    - generic [ref=e240]: Bengali
                - button "ta-IN Listen தமிழ் Tamil" [ref=e241]:
                  - generic [ref=e242]:
                    - text: ta-IN
                    - button "Listen" [ref=e245]:
                      - img
                  - generic [ref=e247]:
                    - generic [ref=e248]: தமிழ்
                    - generic [ref=e249]: Tamil
                - button "te-IN Listen తెలుగు Telugu" [ref=e250]:
                  - generic [ref=e251]:
                    - text: te-IN
                    - button "Listen" [ref=e254]:
                      - img
                  - generic [ref=e256]:
                    - generic [ref=e257]: తెలుగు
                    - generic [ref=e258]: Telugu
                - button "mr-IN Listen मराठी Marathi" [ref=e259]:
                  - generic [ref=e260]:
                    - text: mr-IN
                    - button "Listen" [ref=e263]:
                      - img
                  - generic [ref=e265]:
                    - generic [ref=e266]: मराठी
                    - generic [ref=e267]: Marathi
                - button "gu-IN Listen ગુજરાતી Gujarati" [ref=e268]:
                  - generic [ref=e269]:
                    - text: gu-IN
                    - button "Listen" [ref=e272]:
                      - img
                  - generic [ref=e274]:
                    - generic [ref=e275]: ગુજરાતી
                    - generic [ref=e276]: Gujarati
                - button "kn-IN Listen ಕನ್ನಡ Kannada" [ref=e277]:
                  - generic [ref=e278]:
                    - text: kn-IN
                    - button "Listen" [ref=e281]:
                      - img
                  - generic [ref=e283]:
                    - generic [ref=e284]: ಕನ್ನಡ
                    - generic [ref=e285]: Kannada
                - button "ml-IN Listen മലയാളം Malayalam" [ref=e286]:
                  - generic [ref=e287]:
                    - text: ml-IN
                    - button "Listen" [ref=e290]:
                      - img
                  - generic [ref=e292]:
                    - generic [ref=e293]: മലയാളം
                    - generic [ref=e294]: Malayalam
                - button "pa-IN Listen ਪੰਜਾਬੀ Punjabi" [ref=e295]:
                  - generic [ref=e296]:
                    - text: pa-IN
                    - button "Listen" [ref=e299]:
                      - img
                  - generic [ref=e301]:
                    - generic [ref=e302]: ਪੰਜਾਬੀ
                    - generic [ref=e303]: Punjabi
                - button "od-IN Listen ଓଡ଼ିଆ Odia" [ref=e304]:
                  - generic [ref=e305]:
                    - text: od-IN
                    - button "Listen" [ref=e308]:
                      - img
                  - generic [ref=e310]:
                    - generic [ref=e311]: ଓଡ଼ିଆ
                    - generic [ref=e312]: Odia
            - generic [ref=e313]:
              - generic [ref=e314]:
                - text: "2"
                - heading "मोड चुनें" [level=2] [ref=e315]
              - generic [ref=e316]:
                - button "Civil AffairsSelected सामान्य Listen किसी भी घटना की रिपोर्ट BNSS 2023BNS 2023BSA 2023" [pressed] [ref=e317]:
                  - generic [ref=e318]: Civil AffairsSelected
                  - generic [ref=e319]:
                    - heading "सामान्य" [level=3] [ref=e320]
                    - button "Listen" [ref=e322]:
                      - img
                  - paragraph [ref=e324]: किसी भी घटना की रिपोर्ट
                  - generic [ref=e325]: BNSS 2023BNS 2023BSA 2023
                - button "Juvenile बच्चों के लिए Listen बच्चों के साथ हुई किसी भी घटना के लिए — सुरक्षित बातचीत POCSO Act 2012JJ Act 2015BNSS 2023" [ref=e326]:
                  - generic [ref=e327]: Juvenile
                  - generic [ref=e328]:
                    - heading "बच्चों के लिए" [level=3] [ref=e329]
                    - button "Listen" [ref=e331]:
                      - img
                  - paragraph [ref=e333]: बच्चों के साथ हुई किसी भी घटना के लिए — सुरक्षित बातचीत
                  - generic [ref=e334]: POCSO Act 2012JJ Act 2015BNSS 2023
                - button "Family Court महिला सुरक्षा Listen घरेलू हिंसा, दहेज़ उत्पीड़न, यौन उत्पीड़न BNSS 2023BNS 2023 (Sec 85, 86)PWDVA 2005" [ref=e335]:
                  - generic [ref=e336]: Family Court
                  - generic [ref=e337]:
                    - heading "महिला सुरक्षा" [level=3] [ref=e338]
                    - button "Listen" [ref=e340]:
                      - img
                  - paragraph [ref=e342]: घरेलू हिंसा, दहेज़ उत्पीड़न, यौन उत्पीड़न
                  - generic [ref=e343]: BNSS 2023BNS 2023 (Sec 85, 86)PWDVA 2005
                - button "Elder Welfare वरिष्ठ नागरिक Listen बुज़ुर्गों के साथ दुर्व्यवहार, संपत्ति विवाद Maintenance & Welfare of Parents and Senior Citizens Act 2007BNSS 2023BNS 2023" [ref=e344]:
                  - generic [ref=e345]: Elder Welfare
                  - generic [ref=e346]:
                    - heading "वरिष्ठ नागरिक" [level=3] [ref=e347]
                    - button "Listen" [ref=e349]:
                      - img
                  - paragraph [ref=e351]: बुज़ुर्गों के साथ दुर्व्यवहार, संपत्ति विवाद
                  - generic [ref=e352]: Maintenance & Welfare of Parents and Senior Citizens Act 2007BNSS 2023BNS 2023
                - button "General Counsel कानूनी सलाहकार Listen किसी भी मामले की प्रारंभिक जाँच — क्या वकील की ज़रूरत है? BNSS 2023BNS 2023BSA 2023" [ref=e353]:
                  - generic [ref=e354]: General Counsel
                  - generic [ref=e355]:
                    - heading "कानूनी सलाहकार" [level=3] [ref=e356]
                    - button "Listen" [ref=e358]:
                      - img
                  - paragraph [ref=e360]: किसी भी मामले की प्रारंभिक जाँच — क्या वकील की ज़रूरत है?
                  - generic [ref=e361]: BNSS 2023BNS 2023BSA 2023
            - generic [ref=e362]:
              - generic [ref=e363]:
                - text: "3"
                - heading "यह मामला कितना जरूरी है?" [level=2] [ref=e364]
                - button "Listen" [ref=e365]:
                  - img
              - generic [ref=e367]:
                - button "Listen सामान्य चोरी, कागज़ी काम, FIR दर्ज न होना" [pressed] [ref=e368]:
                  - button "Listen" [ref=e370]:
                    - img
                  - generic [ref=e372]: सामान्य
                  - generic [ref=e373]: चोरी, कागज़ी काम, FIR दर्ज न होना
                - button "Listen गंभीर बार-बार उत्पीड़न, ₹1L से अधिक नुकसान" [ref=e374]:
                  - button "Listen" [ref=e376]:
                    - img
                  - generic [ref=e378]: गंभीर
                  - generic [ref=e379]: बार-बार उत्पीड़न, ₹1L से अधिक नुकसान
                - button "Listen अत्यंत गंभीर हिंसा, बच्चों की सुरक्षा, तत्काल खतरा" [ref=e380]:
                  - button "Listen" [ref=e382]:
                    - img
                  - generic [ref=e384]: अत्यंत गंभीर
                  - generic [ref=e385]: हिंसा, बच्चों की सुरक्षा, तत्काल खतरा
          - complementary [ref=e386]:
            - generic [ref=e387]:
              - figure "Fig. 1.1 — Standard · FirstReport / 2026" [ref=e388]:
                - generic [ref=e389]:
                  - generic [ref=e390]: Fig. 1.1
                  - generic "FirstReport" [ref=e392]:
                    - img [ref=e393]
                  - generic [ref=e398]: Live
                - generic [ref=e399]: Fig. 1.1 — Standard · FirstReport / 2026
              - generic [ref=e400]:
                - text: पूर्वावलोकन
                - paragraph [ref=e401]: नमस्ते। मैं आपकी मदद के लिए हूँ। बताइए, क्या हुआ?
                - generic [ref=e402]:
                  - generic [ref=e403]: Standardhi-IN
                  - button "Listen" [ref=e404]:
                    - img
              - generic [ref=e407]: सामान्य · चोरी, कागज़ी काम, FIR दर्ज न होना
              - button "शुरू करें →" [ref=e408]
              - link "NALSA हेल्पलाइन — 15100 · 15100" [ref=e409] [cursor=pointer]:
                - /url: tel:15100
                - text: NALSA हेल्पलाइन — 15100 · 15100
              - button "§ पुरानी सलाह" [ref=e410]
      - generic [ref=e412]:
        - paragraph [ref=e413]: FirstReport · Voice-first legal aid · Gemma 4 + Sarvam AI
        - generic [ref=e414]: BNSS 2023POCSOPWDVA
        - link "NALSA · 15100" [ref=e415] [cursor=pointer]:
          - /url: tel:15100
```

# Test source

```ts
  1  | import { Page, expect } from '@playwright/test';
  2  | 
  3  | export async function startNewCase(page: Page): Promise<string> {
  4  |   await page.goto('/home?lang=en-IN&demo=true');
  5  |   const startBtn = page.locator('button:has-text("Start")').first();
> 6  |   await startBtn.click();
     |                  ^ Error: locator.click: Test timeout of 30000ms exceeded.
  7  |   
  8  |   await page.waitForURL(/\/(case|login)/, { timeout: 15000 });
  9  |   let currentUrl = page.url();
  10 |   let caseId = '';
  11 |   
  12 |   if (currentUrl.includes('/login')) {
  13 |     const urlObj = new URL(currentUrl);
  14 |     const redirectPath = urlObj.searchParams.get('redirect');
  15 |     if (redirectPath && redirectPath.includes('/case/')) {
  16 |       caseId = redirectPath.split('/case/')[1].split('?')[0];
  17 |       await page.goto(`/case/${caseId}?demo=true`);
  18 |     } else {
  19 |       throw new Error('Redirected to login but no case ID found in redirect param.');
  20 |     }
  21 |   } else {
  22 |     const match = currentUrl.match(/\/case\/([^?]+)/);
  23 |     caseId = match![1];
  24 |   }
  25 |   
  26 |   await expect(page).toHaveURL(/\/case\/.+/);
  27 |   return caseId;
  28 | }
  29 | 
```