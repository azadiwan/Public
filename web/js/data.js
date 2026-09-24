/* Brand config — change the product name here and in index.html <title>. */
window.App = window.App || {};
App.BRAND = { name: "LaunchPoint Education", tagline: "Launch every lesson ready. Build, customize, and improve K–8 lessons in minutes." };

/* LaunchPoint Education — curriculum knowledge base.
   Each topic carries enough real content (key ideas, vocabulary, practice
   questions, a real-world hook and a project prompt) for the offline
   generator to build a usable lesson. The AI endpoint expands on this. */

window.App = window.App || {};

App.GRADES = ["K", "1", "2", "3", "4", "5", "6", "7", "8"];

App.gradeBand = (g) => {
  const n = g === "K" ? 0 : parseInt(g, 10);
  return n <= 2 ? "primary" : n <= 5 ? "upper" : "middle";
};

App.PEDAGOGIES = {
  direct: {
    label: "Direct instruction (I do · We do · You do)",
    blocks: [
      ["hook", "Warm-up & hook", 0.1],
      ["instruction", "Mini-lesson (I do)", 0.25],
      ["guided", "Guided practice (We do)", 0.2],
      ["independent", "Independent practice (You do)", 0.25],
      ["check", "Check for understanding", 0.1],
      ["closure", "Closure & exit ticket", 0.1],
    ],
  },
  inquiry: {
    label: "Inquiry (5E model)",
    blocks: [
      ["hook", "Engage", 0.1],
      ["explore", "Explore", 0.25],
      ["instruction", "Explain", 0.2],
      ["guided", "Elaborate", 0.25],
      ["check", "Evaluate", 0.2],
    ],
  },
  pbl: {
    label: "Problem-based learning",
    blocks: [
      ["hook", "Launch the driving question", 0.12],
      ["instruction", "Need-to-know mini-lesson", 0.18],
      ["explore", "Team investigation", 0.3],
      ["guided", "Build & test a solution", 0.2],
      ["check", "Gallery share & feedback", 0.12],
      ["closure", "Reflection", 0.08],
    ],
  },
  stations: {
    label: "Station rotation",
    blocks: [
      ["hook", "Launch & grouping", 0.1],
      ["guided", "Station 1: Teacher table", 0.25],
      ["independent", "Station 2: Practice", 0.25],
      ["explore", "Station 3: Hands-on / digital", 0.25],
      ["closure", "Regroup & exit ticket", 0.15],
    ],
  },
  discussion: {
    label: "Discussion / Socratic seminar",
    blocks: [
      ["hook", "Opening question", 0.1],
      ["instruction", "Context & close reading", 0.25],
      ["guided", "Small-group discussion", 0.25],
      ["independent", "Whole-class seminar", 0.25],
      ["closure", "Written reflection", 0.15],
    ],
  },
};

App.FORMATS = [
  { id: "pptx", label: "PowerPoint", ext: ".pptx", note: "Also opens in Google Slides & Keynote" },
  { id: "canva", label: "Canva", ext: ".pptx", note: "Canva-ready deck — Create › Import file" },
  { id: "gslides", label: "Google Slides", ext: ".pptx", note: "Upload to Drive › Open with Slides" },
  { id: "pdf", label: "PDF", ext: ".pdf", note: "Lesson plan + student worksheet + answer key" },
  { id: "docx", label: "Word", ext: ".docx", note: "Fully editable; also opens in Google Docs" },
  { id: "worksheet", label: "Worksheet PDF", ext: ".pdf", note: "Student handout only" },
  { id: "quiz", label: "Quiz CSV", ext: ".csv", note: "For Kahoot, Blooket, Quizizz, Google Forms" },
  { id: "flash", label: "Flashcards", ext: ".txt", note: "Quizlet / Gimkit import (tab-separated)" },
  { id: "html", label: "Web page", ext: ".html", note: "Printable, shareable, LMS-embeddable" },
  { id: "md", label: "Markdown", ext: ".md", note: "For Notion, Obsidian, GitHub" },
];

/* Topic library. Fields:
   ideas: key teaching points, vocab: [term, definition],
   qs: [question, answer], hook, project (PBL driving question), standard */
App.SUBJECTS = {
  math: {
    label: "Math", icon: "➗", standardSet: "CCSS-M",
    topics: {
      "Fractions: equivalent fractions": {
        grades: "3-5", standard: "CCSS.MATH.4.NF.A.1",
        hook: "You and a friend each order a pizza. You eat 2 of 4 slices; they eat 4 of 8 slices. Who ate more?",
        ideas: [
          "A fraction names equal parts of a whole: the denominator counts the parts, the numerator counts the parts we have.",
          "Equivalent fractions name the same amount even though the numbers differ (1/2 = 2/4 = 4/8).",
          "Multiply or divide the numerator and denominator by the same number to make an equivalent fraction.",
          "Fraction strips and number lines show equivalence visually — equal lengths mean equal amounts.",
        ],
        vocab: [["numerator", "the top number; how many parts we have"], ["denominator", "the bottom number; how many equal parts make the whole"], ["equivalent", "having the same value"], ["simplest form", "a fraction whose numerator and denominator share no factor but 1"]],
        qs: [["Write a fraction equivalent to 3/4.", "6/8 (or 9/12, 12/16…)"], ["Is 2/6 equivalent to 1/3? Explain.", "Yes — divide 2 and 6 by 2 to get 1/3."], ["Fill in: 5/10 = ?/2", "1"], ["Put in simplest form: 8/12", "2/3"], ["Draw a model showing 2/3 = 4/6.", "Two equal bars: one split into 3 with 2 shaded, one into 6 with 4 shaded; shaded lengths match."]],
        project: "How can we split 3 pizzas fairly among our class so everyone gets an equivalent share?",
      },
      "Ratios & proportional relationships": {
        grades: "6-7", standard: "CCSS.MATH.6.RP.A.3",
        hook: "A recipe for 4 people needs 2 cups of rice. How much for our whole class?",
        ideas: [
          "A ratio compares two quantities (3:2, 3 to 2, or 3/2).",
          "A unit rate tells how much of one quantity per 1 unit of another (e.g. $3 per pound).",
          "Equivalent ratios scale both quantities by the same factor; ratio tables and double number lines organize them.",
          "A proportional relationship has a constant ratio and graphs as a straight line through the origin.",
        ],
        vocab: [["ratio", "a comparison of two quantities"], ["unit rate", "a rate with a denominator of 1"], ["proportion", "an equation stating two ratios are equal"], ["constant of proportionality", "the constant k in y = kx"]],
        qs: [["A car travels 150 miles in 3 hours. What is the unit rate?", "50 miles per hour"], ["Are 4:6 and 10:15 equivalent?", "Yes — both simplify to 2:3."], ["If 5 notebooks cost $12.50, how much do 8 cost?", "$20.00"], ["Solve: 3/x = 9/12", "x = 4"], ["Does y = 4x show a proportional relationship? What is k?", "Yes; k = 4"]],
        project: "Which grocery store gives our families the best value? Compare unit prices and recommend a shopping plan.",
      },
      "Area & perimeter": {
        grades: "3-4", standard: "CCSS.MATH.3.MD.C.7",
        hook: "Our class gets 24 feet of fencing for a garden. What shape gives the most planting space?",
        ideas: [
          "Perimeter is the distance around a shape — add the side lengths.",
          "Area is the space inside a shape, measured in square units.",
          "For a rectangle, area = length × width and perimeter = 2 × (length + width).",
          "Shapes with the same perimeter can have different areas.",
        ],
        vocab: [["perimeter", "the distance around a figure"], ["area", "the number of square units covering a surface"], ["square unit", "a square with sides of 1 unit, used to measure area"], ["dimensions", "the length and width of a shape"]],
        qs: [["Find the area of a 6 cm by 4 cm rectangle.", "24 square cm"], ["Find the perimeter of the same rectangle.", "20 cm"], ["A square has perimeter 20 m. What is its area?", "25 square m"], ["Draw two rectangles with perimeter 16 but different areas.", "e.g. 1×7 (area 7) and 4×4 (area 16)"]],
        project: "Design a class garden with 24 feet of fencing that gives the most growing space.",
      },
      "Solving one-step & two-step equations": {
        grades: "6-8", standard: "CCSS.MATH.7.EE.B.4",
        hook: "I'm thinking of a number. Double it and add 5, you get 17. What's my number?",
        ideas: [
          "An equation says two expressions are equal — like a balanced scale.",
          "Use inverse operations to isolate the variable: undo addition with subtraction, multiplication with division.",
          "Whatever you do to one side, do to the other to keep the balance.",
          "Check a solution by substituting it back into the original equation.",
        ],
        vocab: [["variable", "a letter that stands for an unknown number"], ["inverse operation", "an operation that undoes another"], ["coefficient", "the number multiplied by a variable"], ["solution", "a value that makes an equation true"]],
        qs: [["Solve: x + 7 = 15", "x = 8"], ["Solve: 4y = 28", "y = 7"], ["Solve: 2n + 5 = 17", "n = 6"], ["Solve: x/3 − 4 = 2", "x = 18"], ["Write and solve an equation: 3 tickets plus a $4 fee cost $31.", "3t + 4 = 31; t = $9"]],
        project: "Plan a class fundraiser: write and solve equations to decide the ticket price that meets our goal.",
      },
      "Place value & rounding": {
        grades: "2-4", standard: "CCSS.MATH.4.NBT.A.3",
        hook: "A stadium holds 48,562 fans. A reporter says 'about 50,000.' Is that fair?",
        ideas: [
          "Each digit's value depends on its place: ones, tens, hundreds, thousands…",
          "Each place is worth 10 times the place to its right.",
          "To round, look at the digit to the right of the rounding place: 5 or more rounds up, 4 or less stays.",
          "Rounding helps estimate and check whether answers are reasonable.",
        ],
        vocab: [["place value", "the value of a digit based on its position"], ["digit", "any of the symbols 0–9"], ["round", "to change a number to a nearby, simpler number"], ["estimate", "a close guess found by rounding"]],
        qs: [["What is the value of 7 in 3,742?", "700"], ["Round 486 to the nearest ten.", "490"], ["Round 6,512 to the nearest thousand.", "7,000"], ["Write 4,000 + 300 + 9 in standard form.", "4,309"]],
        project: "How many books are in our school library? Estimate using rounding, then check.",
      },
    },
  },

  science: {
    label: "Science", icon: "🔬", standardSet: "NGSS",
    topics: {
      "Photosynthesis": {
        grades: "5-7", standard: "NGSS MS-LS1-6",
        hook: "A tiny seed becomes a 2-ton oak tree. Where does all that mass come from?",
        ideas: [
          "Plants make their own food (glucose) through photosynthesis.",
          "Inputs: carbon dioxide from the air, water from the roots, and energy from sunlight.",
          "Outputs: glucose (stored energy) and oxygen released into the air.",
          "Chlorophyll in chloroplasts captures light energy; most of a plant's mass comes from CO₂ in the air.",
        ],
        vocab: [["photosynthesis", "the process plants use to turn light energy into chemical energy"], ["chlorophyll", "green pigment that absorbs light"], ["chloroplast", "the organelle where photosynthesis happens"], ["glucose", "a sugar that stores energy"]],
        qs: [["What three things do plants need for photosynthesis?", "Sunlight, water, carbon dioxide"], ["What gas do plants release?", "Oxygen"], ["Where in the cell does photosynthesis occur?", "Chloroplasts"], ["Why would a plant in a dark closet stop growing?", "No light energy means no photosynthesis, so no glucose is made."]],
        project: "How can we design a classroom plant setup that maximizes growth with the least water?",
      },
      "States of matter": {
        grades: "2-5", standard: "NGSS 2-PS1-1",
        hook: "An ice cube, a glass of water, and steam from a kettle — are they the same stuff?",
        ideas: [
          "Matter is anything that has mass and takes up space.",
          "Solids keep their shape; liquids take the shape of their container; gases fill any space.",
          "Adding or removing heat causes changes of state: melting, freezing, evaporation, condensation.",
          "Particles move faster and spread out as matter heats up.",
        ],
        vocab: [["matter", "anything with mass that takes up space"], ["melting", "solid to liquid"], ["evaporation", "liquid to gas"], ["condensation", "gas to liquid"]],
        qs: [["Name the three common states of matter.", "Solid, liquid, gas"], ["What happens to water when it freezes?", "It changes from liquid to solid."], ["Why do water drops form on a cold glass?", "Water vapor in the air condenses on the cold surface."], ["Which state has particles that are closest together?", "Solid"]],
        project: "How can we keep an ice cube from melting the longest using classroom materials?",
      },
      "Ecosystems & food webs": {
        grades: "4-7", standard: "NGSS MS-LS2-3",
        hook: "When wolves returned to Yellowstone, rivers changed course. How?",
        ideas: [
          "Energy flows from the sun to producers, then to consumers and decomposers.",
          "A food chain shows one path of energy; a food web shows many connected chains.",
          "Only about 10% of energy passes to the next level.",
          "Changing one population ripples through the whole ecosystem.",
        ],
        vocab: [["producer", "an organism that makes its own food"], ["consumer", "an organism that eats other organisms"], ["decomposer", "breaks down dead matter"], ["trophic level", "a feeding position in a food chain"]],
        qs: [["What is the original source of energy in most ecosystems?", "The sun"], ["Give an example of a decomposer.", "Fungi, bacteria, earthworms"], ["What might happen if all the rabbits disappeared from a meadow?", "Predators lose food and decline; plants may overgrow."], ["Why are there fewer top predators than producers?", "Energy is lost at each level, so less supports higher levels."]],
        project: "An invasive species arrived in our local park. Model its impact and propose a plan to protect the ecosystem.",
      },
      "Forces & motion": {
        grades: "3-8", standard: "NGSS MS-PS2-2",
        hook: "Why does a soccer ball stop rolling even if nobody touches it?",
        ideas: [
          "A force is a push or pull; forces have size and direction.",
          "Balanced forces cause no change in motion; unbalanced forces change speed or direction.",
          "Friction opposes motion; gravity pulls objects toward Earth.",
          "Newton's laws: inertia, F = m × a, and equal-and-opposite reactions.",
        ],
        vocab: [["force", "a push or pull"], ["friction", "a force that resists motion between surfaces"], ["inertia", "an object's resistance to change in motion"], ["net force", "the combined effect of all forces"]],
        qs: [["What force slows a sliding book?", "Friction"], ["If forces on an object are balanced, what happens to its motion?", "It doesn't change."], ["Which needs more force to accelerate: an empty or full cart?", "The full cart — more mass"], ["Explain a rocket launch using Newton's third law.", "Gas is pushed down; the gas pushes the rocket up."]],
        project: "Design a vehicle that protects an egg passenger in a crash.",
      },
      "The water cycle": {
        grades: "2-5", standard: "NGSS 5-ESS2-1",
        hook: "The water you drank today might have been dinosaur drinking water. How?",
        ideas: [
          "Earth's water is constantly recycled through evaporation, condensation, precipitation, and collection.",
          "The sun's energy drives evaporation.",
          "Water vapor cools and condenses into clouds.",
          "Precipitation returns water to oceans, lakes, and groundwater.",
        ],
        vocab: [["evaporation", "liquid water becoming vapor"], ["condensation", "vapor cooling into droplets"], ["precipitation", "water falling as rain, snow, sleet, or hail"], ["runoff", "water flowing over land into bodies of water"]],
        qs: [["What powers the water cycle?", "The sun"], ["How do clouds form?", "Water vapor cools and condenses into droplets."], ["Name two types of precipitation.", "Rain, snow (sleet, hail)"], ["Where does runoff go?", "Streams, rivers, lakes, oceans"]],
        project: "How can our school collect and reuse rainwater for the garden?",
      },
    },
  },

  social: {
    label: "Social Studies", icon: "🌎", standardSet: "C3 Framework",
    topics: {
      "Community helpers & local government": {
        grades: "K-2", standard: "C3 D2.Civ.1.K-2",
        hook: "Who helps keep our town safe, clean, and running every day?",
        ideas: [
          "A community is a place where people live, work, and help each other.",
          "Community helpers include firefighters, teachers, doctors, and sanitation workers.",
          "Local government (like a mayor and town council) makes rules and provides services.",
          "Citizens help too — by following rules, voting, and volunteering.",
        ],
        vocab: [["community", "a group of people living in the same place"], ["citizen", "a member of a community or country"], ["mayor", "the leader of a town or city"], ["rule", "a guide for how to act"]],
        qs: [["Name two community helpers.", "e.g. firefighter, nurse"], ["What does a mayor do?", "Leads the town and helps make decisions."], ["How can kids help their community?", "e.g. pick up litter, be kind, follow rules"]],
        project: "What would make our playground better, and how can we ask local leaders to help?",
      },
      "Map skills & geography": {
        grades: "2-5", standard: "C3 D2.Geo.2.3-5",
        hook: "You're dropped in a new city with only a paper map. How do you find the library?",
        ideas: [
          "Maps use a title, compass rose, key/legend, and scale.",
          "Cardinal directions: north, south, east, west.",
          "Latitude and longitude lines form a grid to locate places.",
          "The world has 7 continents and 5 oceans.",
        ],
        vocab: [["compass rose", "shows directions on a map"], ["legend", "explains map symbols"], ["scale", "shows real distance"], ["latitude", "imaginary lines running east–west"]],
        qs: [["What does a map legend show?", "What the symbols mean"], ["Name the four cardinal directions.", "N, S, E, W"], ["How many continents are there?", "7"], ["If the scale is 1 in = 10 mi, how far is 3 inches?", "30 miles"]],
        project: "Create a map to guide a new student around our school.",
      },
      "Economics: needs, wants & trade": {
        grades: "2-6", standard: "C3 D2.Eco.1.3-5",
        hook: "You have $10 and a hungry stomach, but a new toy is on sale. What do you choose?",
        ideas: [
          "Needs are things required to survive; wants are things we'd like to have.",
          "Scarcity means we can't have everything, so we make choices.",
          "Opportunity cost is the next-best thing we give up.",
          "People trade goods and services because it makes both sides better off.",
        ],
        vocab: [["scarcity", "limited resources and unlimited wants"], ["opportunity cost", "the value of the next-best choice given up"], ["goods", "things you can touch that satisfy wants"], ["services", "work done for others"]],
        qs: [["Is a bike a need or a want?", "Usually a want"], ["Define opportunity cost with an example.", "Choosing pizza over tacos: tacos are the opportunity cost."], ["Why do countries trade?", "To get goods they can't make as efficiently."]],
        project: "Run a class market: design a product, set a price, and decide what to trade.",
      },
    },
  },

  history: {
    label: "History", icon: "🏛️", standardSet: "C3 / State History",
    topics: {
      "The American Revolution": {
        grades: "5-8", standard: "C3 D2.His.14.6-8",
        hook: "Would you risk everything to break away from the most powerful empire on Earth over a tax on tea?",
        ideas: [
          "After the French and Indian War, Britain taxed the colonies (Stamp Act, Townshend Acts, Tea Act) without colonial representation.",
          "Colonists protested: boycotts, the Boston Tea Party; Britain responded with the Intolerable Acts.",
          "Fighting began at Lexington and Concord (1775); the Declaration of Independence was adopted July 4, 1776.",
          "With French help, the colonists won at Yorktown (1781); the Treaty of Paris (1783) recognized independence.",
        ],
        vocab: [["taxation without representation", "being taxed by a government you have no vote in"], ["Patriot", "a colonist who supported independence"], ["Loyalist", "a colonist loyal to Britain"], ["boycott", "refusing to buy goods as protest"]],
        qs: [["Why were colonists angry about the Stamp Act?", "They were taxed without representation in Parliament."], ["What happened at the Boston Tea Party?", "Colonists dumped British tea into Boston Harbor in protest."], ["When was the Declaration of Independence adopted?", "July 4, 1776"], ["Which country helped the colonists win?", "France"], ["What treaty ended the war?", "Treaty of Paris (1783)"]],
        project: "Was the American Revolution inevitable? Build an evidence-based museum exhibit to argue your position.",
      },
      "Ancient Egypt": {
        grades: "3-6", standard: "C3 D2.His.2.3-5",
        hook: "How did people build a 450-foot pyramid without machines?",
        ideas: [
          "The Nile River's floods made farming possible in the desert.",
          "Pharaohs were rulers seen as god-kings; society had a clear social pyramid.",
          "Egyptians invented hieroglyphics, papyrus, and advanced math and engineering.",
          "Beliefs in the afterlife led to mummification and pyramid tombs.",
        ],
        vocab: [["pharaoh", "ruler of ancient Egypt"], ["hieroglyphics", "Egyptian picture writing"], ["papyrus", "paper made from reeds"], ["mummification", "preserving a body for the afterlife"]],
        qs: [["Why was the Nile important?", "Its floods left rich soil for farming; it was used for travel and trade."], ["What were hieroglyphics?", "A writing system using pictures and symbols."], ["Why did Egyptians build pyramids?", "As tombs for pharaohs to protect them in the afterlife."]],
        project: "Design a museum exhibit that explains how the Nile shaped Egyptian life.",
      },
      "Civil Rights Movement": {
        grades: "4-8", standard: "C3 D2.His.3.6-8",
        hook: "One woman refused to give up her bus seat. How did that spark a movement?",
        ideas: [
          "Jim Crow laws enforced segregation in the South after Reconstruction.",
          "Brown v. Board of Education (1954) ruled school segregation unconstitutional.",
          "Nonviolent protest — the Montgomery Bus Boycott, sit-ins, the March on Washington — pressured change.",
          "The Civil Rights Act (1964) and Voting Rights Act (1965) outlawed discrimination and protected voting.",
        ],
        vocab: [["segregation", "separating people by race"], ["boycott", "refusing to use a service as protest"], ["civil rights", "rights guaranteeing equal treatment"], ["nonviolence", "protest without physical force"]],
        qs: [["What did Brown v. Board decide?", "Segregated public schools were unconstitutional."], ["Who was Rosa Parks?", "An activist whose arrest sparked the Montgomery Bus Boycott."], ["What did the Voting Rights Act of 1965 do?", "Banned discriminatory voting practices like literacy tests."]],
        project: "How can young people create change in their community today? Plan a nonviolent campaign for a local issue.",
      },
    },
  },

  ela: {
    label: "English / ELA", icon: "✍️", standardSet: "CCSS-ELA",
    topics: {
      "Writing a persuasive essay": {
        grades: "4-8", standard: "CCSS.ELA-LITERACY.W.6.1",
        hook: "Should our school have a four-day week? Convince me in one sentence.",
        ideas: [
          "A persuasive essay states a clear claim (thesis) and tries to convince readers.",
          "Support the claim with reasons and evidence: facts, statistics, examples, expert quotes.",
          "Address a counterclaim and rebut it to strengthen your argument.",
          "Use transitions and a strong conclusion with a call to action.",
        ],
        vocab: [["claim", "the main argument"], ["evidence", "facts or examples that support a claim"], ["counterclaim", "an opposing argument"], ["rebuttal", "a response that disproves a counterclaim"]],
        qs: [["What is a claim?", "The main position the writer argues."], ["Name two types of evidence.", "Statistics, expert quotes, examples, facts"], ["Why include a counterclaim?", "It shows you considered other views and makes your argument stronger."], ["Write a thesis for: 'Should homework be banned?'", "Answers vary — must take a clear position."]],
        project: "Write a persuasive letter to the principal proposing one change that would improve our school.",
      },
      "Parts of speech": {
        grades: "2-5", standard: "CCSS.ELA-LITERACY.L.3.1",
        hook: "'The happy dog quickly ran home.' Which word is doing the action?",
        ideas: [
          "Nouns name people, places, things, or ideas.",
          "Verbs show actions or states of being.",
          "Adjectives describe nouns; adverbs describe verbs, adjectives, or other adverbs.",
          "Pronouns replace nouns so we don't repeat them.",
        ],
        vocab: [["noun", "person, place, thing, or idea"], ["verb", "action or state of being"], ["adjective", "describes a noun"], ["adverb", "describes a verb, often ends in -ly"]],
        qs: [["Find the verb: 'Maya jumped over the puddle.'", "jumped"], ["Find the adjective: 'The tall giraffe ate leaves.'", "tall"], ["Replace the noun with a pronoun: 'Sam likes pizza.'", "He likes pizza."], ["Find the adverb: 'She sang loudly.'", "loudly"]],
        project: "Create a 'Mad Libs' style story book for a younger class using parts of speech.",
      },
      "Narrative writing": {
        grades: "2-8", standard: "CCSS.ELA-LITERACY.W.5.3",
        hook: "Tell me about the scariest, funniest, or proudest moment of your summer — in 30 seconds.",
        ideas: [
          "A narrative has characters, a setting, a problem, rising action, a climax, and a resolution.",
          "Strong narratives show rather than tell, using sensory details and dialogue.",
          "Transitions sequence events clearly.",
          "A satisfying ending reflects on the experience or resolves the problem.",
        ],
        vocab: [["plot", "sequence of events"], ["climax", "the turning point"], ["dialogue", "characters' spoken words"], ["sensory details", "descriptions using the five senses"]],
        qs: [["What is the climax of a story?", "The turning point / moment of highest tension."], ["Rewrite to 'show, not tell': 'I was nervous.'", "e.g. My hands shook and my stomach flipped."], ["Name three transition words for sequence.", "First, then, finally (next, after that…)"]],
        project: "Publish a class anthology of personal narratives for families.",
      },
    },
  },

  reading: {
    label: "Reading", icon: "📚", standardSet: "CCSS-ELA Reading",
    topics: {
      "Main idea & supporting details": {
        grades: "2-5", standard: "CCSS.ELA-LITERACY.RI.4.2",
        hook: "If you could tell a friend about this article in just one sentence, what would you say?",
        ideas: [
          "The main idea is what the text is mostly about.",
          "Supporting details give facts, examples, or reasons that explain the main idea.",
          "Titles, headings, and first/last sentences often hint at the main idea.",
          "A good summary states the main idea plus key details in your own words.",
        ],
        vocab: [["main idea", "the most important point"], ["supporting detail", "information that explains the main idea"], ["summary", "a short retelling of the most important parts"], ["topic", "the subject of a text in a word or two"]],
        qs: [["What's the difference between topic and main idea?", "Topic is a word or phrase; main idea is a full sentence about the topic."], ["Where can you often find the main idea?", "Title, headings, first or last sentence"], ["Why are supporting details important?", "They explain and prove the main idea."]],
        project: "Create a 'kid news' bulletin summarizing real articles for younger students.",
      },
      "Making inferences": {
        grades: "3-7", standard: "CCSS.ELA-LITERACY.RL.5.1",
        hook: "A girl walks in dripping wet, holding a broken umbrella. What happened?",
        ideas: [
          "An inference is a conclusion based on text clues plus what you already know.",
          "Text clue + background knowledge = inference.",
          "Good readers cite evidence to support their inferences.",
          "Authors imply feelings and motives rather than stating them.",
        ],
        vocab: [["inference", "a conclusion reached from evidence and reasoning"], ["evidence", "details from the text"], ["schema", "background knowledge"], ["imply", "to suggest without stating directly"]],
        qs: [["What two things do you combine to make an inference?", "Text clues and background knowledge"], ["'Jake slammed the door and stomped upstairs.' How does Jake feel?", "Angry or upset — slamming and stomping are clues."], ["Why should you cite evidence for an inference?", "To prove it's based on the text, not a guess."]],
        project: "Create a mystery 'evidence box' for classmates to solve with inferences.",
      },
      "Phonics: short & long vowels": {
        grades: "K-2", standard: "CCSS.ELA-LITERACY.RF.1.3",
        hook: "What changes when 'cap' gets a magic e and becomes 'cape'?",
        ideas: [
          "Vowels are a, e, i, o, u (and sometimes y).",
          "Short vowels say their sound: a as in cat, e in bed, i in pig, o in hop, u in sun.",
          "Long vowels say their name, often with a silent 'magic e' (cake, bike, rope).",
          "Two vowels together often make the first one long (rain, boat).",
        ],
        vocab: [["vowel", "a, e, i, o, u"], ["short vowel", "a vowel saying its sound"], ["long vowel", "a vowel saying its name"], ["silent e", "an e at the end that makes the vowel long"]],
        qs: [["Is the vowel in 'hat' short or long?", "Short"], ["Add a silent e to 'kit'. What's the new word?", "kite"], ["Sort: bike, sun, rope, bed", "Long: bike, rope. Short: sun, bed."]],
        project: "Make a class 'magic e' word book with illustrations.",
      },
    },
  },

  languages: {
    label: "World Languages", icon: "🗣️", standardSet: "ACTFL",
    topics: {
      "Spanish: greetings & introductions": {
        grades: "K-8", standard: "ACTFL Interpersonal Novice",
        hook: "You just landed in Mexico City and someone says '¡Hola! ¿Cómo te llamas?' What now?",
        ideas: [
          "Greetings change by time of day: buenos días, buenas tardes, buenas noches.",
          "Introduce yourself: Me llamo… / Soy… ; ask: ¿Cómo te llamas?",
          "Ask how someone is: ¿Cómo estás? — Bien, mal, más o menos.",
          "Tú is informal; usted is formal (adults, strangers).",
        ],
        vocab: [["hola", "hello"], ["¿Cómo te llamas?", "What's your name?"], ["mucho gusto", "nice to meet you"], ["adiós", "goodbye"]],
        qs: [["How do you say 'good morning'?", "Buenos días"], ["Answer: ¿Cómo te llamas?", "Me llamo [name]."], ["When do you use 'usted'?", "With adults, strangers, or to be formal."]],
        project: "Record a short video introducing yourself to a pen pal class in a Spanish-speaking country.",
      },
      "French: numbers & colors": {
        grades: "K-6", standard: "ACTFL Interpretive Novice",
        hook: "Can you order 3 red macarons in a Paris bakery?",
        ideas: [
          "Numbers 1–10: un, deux, trois, quatre, cinq, six, sept, huit, neuf, dix.",
          "Colors: rouge, bleu, vert, jaune, noir, blanc.",
          "In French, most adjectives (including colors) come after the noun: une pomme rouge.",
          "Colors change to agree with feminine or plural nouns (vert → verte → verts).",
        ],
        vocab: [["rouge", "red"], ["bleu", "blue"], ["cinq", "five"], ["dix", "ten"]],
        qs: [["Count from 1 to 5 in French.", "un, deux, trois, quatre, cinq"], ["Translate: a blue car", "une voiture bleue"], ["Where do color adjectives usually go?", "After the noun"]],
        project: "Open a pretend French café: design a menu with prices and colors and role-play ordering.",
      },
      "Spanish: family & descriptions": {
        grades: "3-8", standard: "ACTFL Presentational Novice",
        hook: "Show a photo of your family (or a famous family) and describe them — in Spanish!",
        ideas: [
          "Family words: madre, padre, hermano/a, abuelo/a, tío/a, primo/a.",
          "Possessives: mi, tu, su (mi hermana, tus primos).",
          "Describe with ser + adjective: Mi padre es alto y simpático.",
          "Adjectives agree in gender and number: alto/alta/altos/altas.",
        ],
        vocab: [["la madre", "mother"], ["el hermano", "brother"], ["alto/a", "tall"], ["simpático/a", "nice"]],
        qs: [["Translate: my sister is funny.", "Mi hermana es graciosa (divertida/cómica)."], ["What is the feminine of 'alto'?", "alta"], ["What does 'mis abuelos' mean?", "my grandparents"]],
        project: "Create a family tree poster with Spanish descriptions and present it to the class.",
      },
    },
  },

  testprep: {
    label: "Test Prep", icon: "📝", standardSet: "State tests · MAP · SBAC · ISEE/SSAT",
    topics: {
      "Reading comprehension strategies": {
        grades: "3-8", standard: "State ELA assessment",
        hook: "Here's a passage and 5 questions. Should you read the questions first or the passage first?",
        ideas: [
          "Preview questions, then read actively — underline key ideas and circle unfamiliar words.",
          "Use process of elimination: cross out answers that are too broad, too narrow, or not in the text.",
          "For evidence-based questions, the answer to Part B must support Part A.",
          "Budget time: roughly 1 minute per question, and return to skipped items.",
        ],
        vocab: [["process of elimination", "ruling out wrong answers"], ["distractor", "a tempting but wrong choice"], ["text evidence", "a quote or detail that proves an answer"], ["annotate", "mark up a text while reading"]],
        qs: [["What is a distractor?", "A wrong answer designed to look right."], ["Name two ways to eliminate answer choices.", "Too broad/narrow; not in text; contradicts text; extreme words"], ["What's the link between Part A and Part B questions?", "Part B's evidence must support Part A's answer."]],
        project: "Create a class 'strategy playbook' with examples of each test-taking strategy.",
      },
      "Multi-step word problems": {
        grades: "3-8", standard: "State math assessment",
        hook: "A field trip costs $12 per student plus a $60 bus fee. 25 students go. What's the total?",
        ideas: [
          "Read twice: first for the story, second for the numbers and the question.",
          "Identify what's asked and underline key information; cross out extra information.",
          "Plan the steps: draw a model, write an equation, or make a table.",
          "Check that your answer is reasonable and labeled with units.",
        ],
        vocab: [["key words", "clue words that suggest an operation"], ["extraneous information", "details not needed to solve"], ["reasonable", "makes sense in context"], ["estimate", "a close approximate answer"]],
        qs: [["Solve the field trip problem from the hook.", "25 × 12 + 60 = $360"], ["Maria has 48 stickers and gives 1/4 away, then buys 10. How many now?", "46"], ["Why should you estimate first?", "To check if the final answer is reasonable."]],
        project: "Write a set of original multi-step problems about our school to challenge another class.",
      },
      "Vocabulary in context": {
        grades: "3-8", standard: "State ELA / ISEE / SSAT",
        hook: "'The desert was arid; nothing had grown there in years.' What does arid mean?",
        ideas: [
          "Context clues are hints in nearby words: definitions, synonyms, antonyms, examples.",
          "Word parts (prefixes, roots, suffixes) unlock meaning: un-, re-, -ful, bio, graph.",
          "Substitute your guessed meaning into the sentence to test it.",
          "Tone words matter: is the word positive, negative, or neutral?",
        ],
        vocab: [["context clue", "a hint in the text about a word's meaning"], ["prefix", "word part added to the beginning"], ["root", "the core part of a word"], ["connotation", "the feeling a word suggests"]],
        qs: [["What does 'arid' mean in the hook?", "Very dry"], ["What does the prefix 'mis-' mean?", "Wrong or badly"], ["Use context: 'The benevolent king gave food to the poor.' Benevolent means…", "Kind, generous"]],
        project: "Build a vocabulary 'word wall' game that other classes can play.",
      },
    },
  },

  pbl: {
    label: "Problem-Based / STEM", icon: "🧩", standardSet: "NGSS · CCSS · ISTE",
    topics: {
      "Design a sustainable school lunch": {
        grades: "4-8", standard: "NGSS 3-5-ETS1-1 · CCSS Math Practice 4",
        hook: "Our cafeteria throws away about 40 pounds of food every day. Can we fix that?",
        ideas: [
          "Define the problem with data: measure and categorize waste.",
          "Research nutrition guidelines, costs, and student preferences.",
          "Brainstorm and prototype solutions (menu changes, share tables, composting).",
          "Test, measure impact, iterate, and present recommendations to decision-makers.",
        ],
        vocab: [["sustainability", "meeting needs without harming the future"], ["prototype", "an early model to test an idea"], ["data", "facts collected for analysis"], ["stakeholder", "anyone affected by a decision"]],
        qs: [["Why collect data before brainstorming?", "To understand the real size and cause of the problem."], ["Who are the stakeholders in school lunch?", "Students, cafeteria staff, parents, administrators"], ["How will we know if our solution worked?", "Compare waste measurements before and after."]],
        project: "How might we cut our cafeteria food waste in half while keeping lunches healthy and popular?",
      },
      "Engineering a water filter": {
        grades: "3-8", standard: "NGSS MS-ETS1-2",
        hook: "Nearly 2 billion people drink unsafe water. Could you design a filter with sand and charcoal?",
        ideas: [
          "The engineering design process: ask, imagine, plan, create, test, improve.",
          "Filtration layers (gravel, sand, charcoal) remove particles of different sizes.",
          "Measure results: clarity, flow rate, cost.",
          "Real engineers balance constraints like cost, materials, and time.",
        ],
        vocab: [["filtration", "separating solids from liquids"], ["constraint", "a limit on a design"], ["criteria", "requirements for success"], ["iterate", "improve through repeated testing"]],
        qs: [["Why use several filter layers?", "Each layer catches different particle sizes."], ["What's a constraint in this project?", "e.g. budget, materials, time"], ["How could you measure filter success?", "Clarity rating, turbidity, flow time"]],
        project: "Design the most effective, lowest-cost water filter for a community with dirty water.",
      },
      "Plan a community park": {
        grades: "3-8", standard: "CCSS.MATH.6.G.A.1 · C3 D2.Civ.10",
        hook: "The town has an empty lot and $50,000. What should it become?",
        ideas: [
          "Survey the community to learn what people need.",
          "Use scale drawings, area, and budgets to design the space.",
          "Consider accessibility, safety, and the environment.",
          "Pitch the design to a real or mock city council.",
        ],
        vocab: [["survey", "questions to gather opinions"], ["scale drawing", "a drawing with proportional measurements"], ["budget", "a plan for spending money"], ["accessibility", "usable by people of all abilities"]],
        qs: [["Why survey the community first?", "To design for real needs."], ["If a map scale is 1 cm = 5 m, how long is a 12 cm path?", "60 m"], ["Name one accessibility feature for a park.", "Ramps, wide paths, accessible playground surfaces"]],
        project: "Design and pitch a park for our town's empty lot within a $50,000 budget.",
      },
    },
  },
};

App.findTopic = (subjectId, topicName) =>
  (App.SUBJECTS[subjectId] && App.SUBJECTS[subjectId].topics[topicName]) || null;
