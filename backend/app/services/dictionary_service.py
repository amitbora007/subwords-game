"""
Dictionary and Lexicon Service for Subwords.
Provides root word selection, multiset anagram validation, and hybrid lexical lookup.
"""

from collections import Counter
from typing import List
import httpx

# Curated base word list: 6 or more characters with rich subword anagram potential
WORD_LIST = [
    # 6 letter words
    "castle", "planet", "stream", "master", "wonder", "forest", "garden", "island",
    "silver", "nature", "spring", "travel", "winter", "bridge", "flower", "orange",
    "golden", "friend", "doctor", "person", "school", "father", "mother", "yellow",
    "window", "animal", "bottle", "pencil", "market", "church", "sister", "summer",
    "farmer", "guitar", "rocket", "pocket", "candle", "secret", "energy", "monkey",
    "turtle", "wizard", "dragon", "knight", "pirate", "circus", "violin", "falcon",
    "palace", "hunter", "prince", "shadow", "banner", "danger", "temple", "anchor",
    "fabric", "jungle", "meteor", "canyon", "desert", "oxygen", "copper", "velvet",
    "timber", "harbor", "legend", "puddle", "magnet", "powder", "shield", "statue",
    "vector", "blanket", "organic",
    # 7 letter words
    "sunlight", "rainbow", "volcano", "weather", "problem", "student", "teacher",
    "crystal", "cartoon", "fantasy", "graphic", "harvest", "monster", "network",
    "balance", "captain", "journey", "whisper", "diamond", "feather", "kitchen",
    "lantern", "morning", "mystery", "package", "quarter", "station", "thunder",
    "village", "painter", "blanket", "freedom", "pyramid",
    # 8+ letter words
    "universal", "elephant", "abstract", "electric", "internet", "keyboard",
    "language", "triangle", "question", "umbrella", "champion", "creature",
    "treasure", "mountain", "calendar", "hospital", "dinosaur", "painting",
    "building", "daughter", "sunshine", "midnight", "firework", "starlight"
]

# In-memory dictionary for fast O(1) subword validation
VALID_WORDS = {
    # 3 letter words
    "ace", "act", "add", "age", "ago", "aid", "aim", "air", "all", "and", "ant", "any", "ape", "arc", "are", "ark", "arm", "art", "ash", "ask", "ate", "awe", "axe",
    "bad", "bag", "ban", "bar", "bat", "bay", "bed", "bee", "bet", "bid", "big", "bin", "bit", "bow", "box", "boy", "bud", "bug", "bun", "bus", "but", "buy",
    "cab", "can", "cap", "car", "cat", "cob", "cod", "cog", "cop", "cot", "cow", "cox", "coy", "cry", "cub", "cud", "cue", "cup", "cur", "cut",
    "dad", "dam", "day", "den", "dew", "did", "die", "dig", "dim", "dip", "doc", "doe", "dog", "don", "dot", "dry", "dub", "dud", "due", "dug", "dun", "duo", "dye",
    "ear", "eat", "ebb", "egg", "ego", "elf", "elk", "elm", "emu", "end", "era", "err", "eve", "ewe", "eye",
    "fad", "fan", "far", "fat", "fax", "fed", "fee", "fen", "few", "fib", "fig", "fin", "fir", "fit", "fix", "fly", "fob", "foe", "fog", "for", "fox", "fry", "fun", "fur",
    "gab", "gag", "gal", "gap", "gas", "gay", "gel", "gem", "get", "gig", "gin", "gnu", "god", "got", "gum", "gun", "gut", "guy", "gym",
    "had", "hag", "ham", "has", "hat", "hay", "hem", "hen", "her", "hew", "hex", "hey", "hid", "him", "hip", "his", "hit", "hob", "hog", "hop", "hot", "how", "hub", "hue", "hug", "hum", "hut",
    "ice", "icy", "ill", "imp", "ink", "inn", "ion", "ire", "irk", "its", "ivy",
    "jab", "jag", "jam", "jar", "jaw", "jay", "jet", "jig", "job", "jog", "jot", "joy", "jug",
    "keg", "ken", "key", "kid", "kin", "kit",
    "lab", "lad", "lag", "lap", "law", "lax", "lay", "lea", "led", "leg", "let", "lib", "lid", "lie", "lip", "lit", "log", "lot", "low",
    "mad", "man", "map", "mar", "mat", "maw", "max", "may", "men", "met", "mid", "mix", "mob", "mod", "mom", "mop", "mow", "mud", "mug", "mum",
    "nab", "nag", "nap", "nay", "net", "new", "nib", "nil", "nip", "nit", "nod", "nor", "not", "now", "nun", "nut",
    "oak", "oar", "oat", "odd", "ode", "off", "oft", "oil", "old", "one", "opt", "orb", "ore", "our", "out", "owe", "owl", "own",
    "pad", "pal", "pan", "pap", "par", "pat", "paw", "pax", "pay", "pea", "peg", "pen", "pep", "per", "pet", "pew", "pie", "pig", "pin", "pit", "ply", "pod", "pop", "pot", "pox", "pry", "pub", "pug", "pun", "pup", "pus", "put",
    "rag", "ram", "ran", "rap", "rat", "raw", "ray", "red", "ref", "rem", "rep", "rev", "rib", "rid", "rig", "rim", "rip", "rob", "rod", "roe", "rot", "row", "rub", "rug", "rum", "run", "rut", "rye",
    "sac", "sad", "sag", "sap", "sat", "saw", "sax", "say", "sea", "see", "set", "sew", "sex", "she", "shy", "sin", "sip", "sir", "sis", "sit", "six", "ska", "ski", "sky", "sly", "sob", "sod", "son", "sop", "sot", "sow", "sox", "soy", "spa", "spy", "sty", "sub", "sue", "sum", "sun", "sup",
    "tab", "tad", "tag", "tan", "tap", "tar", "tat", "tax", "tea", "tee", "ten", "the", "thy", "tic", "tie", "tin", "tip", "tit", "toe", "ton", "too", "top", "tot", "tow", "toy", "try", "tub", "tug", "two",
    "ugh", "ump", "urn", "use",
    "van", "vat", "vet", "via", "vie", "vow",
    "wad", "wag", "war", "was", "wax", "way", "web", "wed", "wee", "wet", "who", "why", "wig", "win", "wit", "woe", "wok", "won", "woo", "wow",
    "yak", "yam", "yap", "yaw", "yea", "yen", "yes", "yet", "yew", "yin", "yip", "you", "yow", "yup",
    "zap", "zen", "zip", "zit", "zoo",
    # 4 letter words
    "able", "ache", "acid", "acne", "acre", "aged", "aide", "ajar", "also", "amen", "amid", "area", "army", "atom", "aunt", "auto", "away",
    "baby", "back", "bake", "ball", "band", "bank", "bare", "bark", "barn", "base", "bath", "bead", "beak", "beam", "bean", "bear", "beat", "been", "beer", "bell", "belt", "bend", "bent", "best", "bill", "bind", "bird", "bite", "blow", "blue", "boat", "body", "boil", "bold", "bolt", "bomb", "bond", "bone", "book", "boom", "boot", "bore", "born", "boss", "both", "bowl", "burn", "busy",
    "cafe", "cage", "cake", "calf", "call", "calm", "came", "camp", "cane", "cape", "card", "care", "carp", "cart", "case", "cash", "cast", "cave", "cell", "cent", "chat", "chef", "chin", "chip", "chop", "cite", "city", "clad", "clam", "clan", "claw", "clay", "clip", "club", "clue", "coal", "coat", "code", "coin", "cold", "cole", "colt", "comb", "come", "cone", "cook", "cool", "cope", "copy", "cord", "core", "cork", "corn", "cost", "coup", "cove", "crab", "cram", "crew", "crib", "crop", "crow", "cube", "cult", "curb", "cure", "curl", "cute",
    "dale", "dame", "damp", "dare", "dark", "darn", "dart", "dash", "data", "date", "dawn", "days", "dead", "deaf", "deal", "dean", "dear", "debt", "deck", "deed", "deem", "deep", "deer", "deft", "demo", "deny", "desk", "dial", "dice", "diet", "dime", "dine", "dire", "dirt", "disc", "dish", "disk", "dive", "dock", "does", "doll", "dome", "done", "doom", "door", "dope", "dose", "dote", "dove", "down", "doze", "drag", "dram", "draw", "drew", "drip", "drop", "drum", "dual", "duck", "duct", "duel", "duet", "duke", "dull", "dumb", "dump", "dune", "dunk", "dupe", "dusk", "dust", "duty", "dyed", "dyer",
    "each", "earl", "earn", "ease", "east", "easy", "echo", "edge", "edit", "else", "emit", "epic", "even", "ever", "evil", "exam", "exit", "eyed", "eyes",
    "face", "fact", "fade", "fail", "fair", "fake", "fall", "fame", "fare", "farm", "fast", "fate", "fawn", "fear", "feat", "feed", "feel", "feet", "fell", "felt", "fern", "fest", "feud", "file", "fill", "film", "find", "fine", "fire", "firm", "fish", "fist", "five", "flag", "flak", "flap", "flat", "flaw", "flea", "fled", "flee", "flew", "flex", "flip", "flit", "flow", "flux", "foal", "foam", "foci", "folk", "fond", "font", "food", "fool", "foot", "ford", "fore", "fork", "form", "fort", "foul", "four", "fowl", "fray", "free", "fret", "from", "fuel", "full", "fume", "fund", "funk", "furl", "fuse", "fuss", "fuze", "fuzz",
    "gain", "gait", "gale", "gall", "game", "gang", "gape", "garb", "gate", "gave", "gaze", "gear", "gene", "germ", "gift", "gild", "gilt", "girl", "gist", "give", "glad", "glee", "glen", "glib", "glob", "glow", "glue", "glut", "gnat", "gnaw", "goal", "goat", "goes", "gold", "golf", "gone", "good", "gore", "gory", "gown", "grab", "gram", "gray", "grew", "grey", "grid", "grim", "grin", "grip", "grit", "grow", "grub", "gulf", "gull", "gulp", "gunk", "guru", "gush", "gust",
    "hail", "hair", "half", "hall", "halo", "halt", "hand", "hang", "hank", "hard", "hare", "hark", "harm", "harp", "hash", "hate", "haul", "have", "hawk", "haze", "hazy", "head", "heal", "heap", "hear", "heat", "heed", "heel", "heir", "held", "hell", "helm", "help", "hemp", "herd", "here", "hero", "hers", "hide", "high", "hike", "hill", "hilt", "hind", "hint", "hire", "hiss", "hive", "hoax", "hold", "hole", "holy", "home", "hone", "hood", "hoof", "hook", "hoop", "hoot", "hope", "horn", "hose", "host", "hour", "huge", "hulk", "hull", "hump", "hung", "hunk", "hunt", "hurl", "hurt", "hush", "husk", "hymn",
    "icon", "idea", "idle", "idol", "inch", "into", "iris", "iron", "isle", "itch", "item",
    "jade", "jail", "jape", "java", "jazz", "jeer", "jerk", "jest", "jibe", "jilt", "jive", "jobs", "joey", "john", "join", "joke", "jolt", "josh", "jowl", "judo", "judy", "juke", "july", "jump", "june", "junk", "jury", "just", "jute",
    "kale", "keen", "keep", "kelp", "kept", "kick", "kill", "kiln", "kilt", "kind", "king", "kink", "kiss", "kite", "kiwi", "knee", "knew", "knit", "knob", "knot", "know",
    "lace", "lack", "lacy", "lady", "laid", "lain", "lair", "lake", "lam", "lamb", "lame", "lamp", "land", "lane", "lank", "lard", "lark", "lash", "lass", "last", "late", "laud", "lava", "lawn", "lazy", "lead", "leaf", "leak", "lean", "leap", "left", "lemon", "lend", "lens", "lent", "less", "lest", "levy", "lewd", "liar", "lice", "lick", "lied", "lien", "lies", "life", "lift", "like", "lilt", "lily", "limb", "lime", "limp", "line", "link", "lint", "lion", "lisp", "list", "lite", "live", "load", "loaf", "loam", "loan", "lobe", "lock", "loco", "lode", "loft", "logo", "loin", "lone", "long", "look", "loom", "loon", "loop", "loot", "lope", "lord", "lore", "lorn", "lose", "loss", "lost", "loud", "lout", "love", "lube", "luck", "lull", "lump", "lung", "lure", "lurk", "lush", "lust", "lute", "lynx",
    "mace", "made", "maid", "mail", "maim", "main", "make", "male", "mall", "malt", "mama", "mane", "many", "mare", "mark", "mars", "mart", "mash", "mask", "mass", "mast", "mate", "math", "maul", "maze", "mead", "meal", "mean", "meat", "meek", "meet", "meld", "melt", "memo", "mend", "menu", "meow", "mere", "mesh", "mess", "mica", "mice", "midi", "mild", "mile", "milk", "mill", "milt", "mime", "mind", "mine", "ming", "mini", "mink", "mint", "minx", "mire", "miss", "mist", "mite", "mitt", "moan", "moat", "mock", "mode", "mold", "mole", "molt", "monk", "mono", "mood", "moon", "moor", "moot", "mope", "more", "morn", "moss", "most", "moth", "move", "much", "muck", "muff", "mule", "mull", "mummy", "muse", "mush", "musk", "must", "mute", "mutt", "myth",
    "nail", "name", "nape", "navy", "near", "neat", "neck", "need", "neon", "nest", "news", "newt", "next", "nice", "nick", "nine", "node", "none", "noon", "nope", "norm", "nose", "note", "noun", "nova", "nude", "null", "numb", "nuts",
    "oath", "obey", "oboe", "odds", "ode", "odor", "ogre", "okay", "omen", "omit", "once", "only", "onto", "onus", "ooze", "opal", "open", "opus", "oral", "orca", "ores", "otto", "ouch", "ours", "oust", "outs", "oven", "over", "owed", "owes", "owls",
    "pace", "pack", "pact", "page", "paid", "pail", "pain", "pair", "pale", "pall", "palm", "pane", "pang", "pant", "papa", "pare", "park", "part", "pass", "past", "pate", "path", "pave", "pawn", "peak", "peal", "pear", "peas", "peat", "peck", "peek", "peel", "peep", "peer", "pelt", "pend", "pent", "peon", "perk", "perm", "pert", "peso", "pest", "pets", "pews", "phew", "pick", "pied", "pier", "pies", "pike", "pile", "pill", "pimp", "pine", "ping", "pink", "pint", "piny", "pion", "pipe", "piss", "pith", "pits", "pity", "plan", "play", "plea", "pled", "plod", "plot", "plow", "ploy", "plug", "plum", "plus", "pock", "pods", "poem", "poet", "poke", "pole", "poll", "polo", "pomp", "pond", "pone", "pony", "pooh", "pool", "poop", "poor", "pope", "pops", "pore", "pork", "porn", "port", "pose", "posh", "post", "posy", "pour", "pout", "pray", "prep", "prey", "prig", "prim", "prod", "prof", "prom", "prop", "pros", "prow", "prune", "pubs", "puck", "puff", "puke", "pull", "pulp", "puma", "pump", "punk", "puns", "puny", "pupa", "pups", "pure", "purl", "purr", "push", "puss", "puts",
    "quad", "quag", "quay", "queen", "quell", "query", "quest", "queue", "quick", "quid", "quiet", "quill", "quilt", "quit", "quite", "quiz", "quota", "quote",
    "race", "rack", "racy", "raft", "rage", "raid", "rail", "rain", "rake", "ramp", "rand", "rang", "rank", "rant", "rare", "rash", "rasp", "rate", "rave", "rays", "raze", "read", "real", "ream", "reap", "rear", "reed", "reef", "reek", "reel", "rein", "rely", "rend", "rent", "rest", "revs", "rice", "rich", "rick", "ride", "rife", "rift", "rigs", "rile", "rill", "rime", "rind", "ring", "rink", "riot", "ripe", "rise", "risk", "rite", "road", "roam", "roan", "roar", "robe", "rock", "rode", "rods", "role", "roll", "romp", "rood", "roof", "rook", "room", "root", "rope", "ropy", "rose", "rosy", "rote", "rots", "rout", "rove", "rows", "rube", "ruby", "ruck", "rude", "rued", "rues", "ruff", "rugs", "ruin", "rule", "rump", "rums", "rune", "rung", "runs", "runt", "ruse", "rush", "rusk", "rust", "ruts",
    "sack", "safe", "saga", "sage", "said", "sail", "sake", "sale", "salt", "same", "sand", "sane", "sang", "sank", "saps", "sari", "sash", "sass", "save", "saws", "says", "scab", "scad", "scam", "scan", "scar", "scat", "scow", "seal", "seam", "sear", "seas", "seat", "sect", "seed", "seek", "seem", "seen", "seep", "seer", "sees", "self", "sell", "semi", "send", "sent", "sept", "serf", "sets", "sewn", "sews", "shad", "shag", "shah", "sham", "shed", "shim", "shin", "ship", "shod", "shoe", "shoo", "shop", "shot", "show", "shun", "shut", "sick", "side", "sift", "sigh", "sign", "silk", "sill", "silo", "silt", "sine", "sing", "sink", "sips", "sire", "sirs", "site", "sits", "size", "skew", "skid", "skim", "skin", "skip", "skis", "skit", "slab", "slag", "slam", "slap", "slat", "slaw", "slay", "sled", "slew", "slid", "slim", "slip", "slit", "slob", "sloe", "slog", "slop", "slot", "slow", "slue", "slug", "slum", "slur", "smog", "smug", "smut", "snag", "snap", "snip", "snit", "snob", "snot", "snow", "snub", "snug", "soak", "soap", "soar", "sobs", "sock", "soda", "sods", "sofa", "soft", "soil", "sold", "sole", "solo", "some", "song", "sons", "soon", "soot", "sops", "sore", "sort", "soul", "soup", "sour", "sown", "sows", "span", "spar", "spas", "spat", "spay", "spec", "sped", "spew", "spin", "spit", "spot", "spry", "spud", "spun", "spur", "stab", "stag", "star", "stat", "stay", "stem", "step", "stew", "stir", "stop", "stow", "stub", "stud", "stun", "sty", "subs", "such", "suck", "suds", "sued", "sues", "suit", "sulk", "sumo", "sump", "sums", "sunk", "suns", "sups", "sure", "surf", "swab", "swag", "swam", "swan", "swap", "swat", "sway", "swig", "swim", "swop", "swum",
    "tack", "taco", "tact", "tags", "tail", "take", "tale", "talk", "tall", "tame", "tamp", "tang", "tank", "tape", "taps", "tare", "tarn", "tarp", "tars", "tart", "task", "taut", "taxi", "teak", "teal", "team", "tear", "teas", "teat", "tech", "teed", "teem", "teen", "tees", "tell", "temp", "tend", "tens", "tent", "term", "tern", "test", "text", "than", "that", "thaw", "thee", "them", "then", "thew", "they", "thin", "this", "thud", "thug", "thus", "tick", "tics", "tide", "tidy", "tied", "tier", "ties", "tiff", "tiger", "tile", "till", "tilt", "time", "tine", "ting", "tins", "tint", "tiny", "tips", "tire", "toad", "toed", "toes", "toff", "tofu", "toga", "togs", "toil", "told", "toll", "tomb", "tome", "toms", "tone", "tong", "tons", "tony", "took", "tool", "toot", "tops", "tore", "torn", "tort", "tory", "toss", "tote", "tots", "tour", "tout", "town", "toys", "tram", "trap", "tray", "tree", "trek", "trim", "trio", "trip", "trod", "trot", "troy", "true", "tsar", "tuba", "tube", "tubs", "tuck", "tuft", "tugs", "tuna", "tune", "tuns", "turd", "turf", "turn", "tusk", "tutu", "twas", "twig", "twin", "twit", "twos", "type",
    "ugly", "ulna", "umps", "undo", "unit", "unto", "upon", "urea", "urge", "urns", "used", "user", "uses",
    "vain", "vale", "vamp", "vane", "vans", "vary", "vase", "vast", "vats", "veal", "veep", "veer", "veil", "vein", "vend", "vent", "verb", "vers", "very", "vest", "veto", "vets", "vial", "vibe", "vice", "vied", "vies", "view", "vile", "vine", "vino", "vins", "viol", "visa", "vise", "void", "vole", "volt", "vote", "vows", "vying",
    "wade", "wads", "waft", "wage", "wail", "wait", "wake", "walk", "wall", "wand", "wane", "want", "ward", "ware", "warm", "warn", "warp", "wars", "wart", "wary", "wash", "wasp", "watt", "wave", "wavy", "waxy", "ways", "weak", "weal", "wean", "wear", "webs", "weds", "weed", "week", "weep", "weft", "weir", "well", "welt", "went", "wept", "were", "west", "wets", "wham", "what", "when", "whet", "whey", "whim", "whip", "whir", "whit", "whiz", "whoa", "whom", "wick", "wide", "wife", "wigs", "wild", "wile", "will", "wilt", "wily", "wimp", "wind", "wine", "wing", "wink", "wins", "winy", "wipe", "wire", "wiry", "wise", "wish", "wisp", "with", "wits", "woes", "woke", "woks", "wolf", "womb", "wont", "wood", "woof", "wool", "woos", "word", "wore", "work", "worm", "worn", "wort", "wove", "wows", "wrap", "wren", "writ",
    "yaks", "yams", "yang", "yank", "yaps", "yard", "yarn", "yawl", "yawn", "yaws", "yeah", "year", "yeas", "yell", "yelp", "yens", "yeps", "yews", "yids", "yins", "yips", "yoke", "yolk", "yond", "yore", "york", "your", "yowl", "yows", "yuan", "yuck", "yule", "yups", "yurt",
    "zany", "zaps", "zeal", "zebu", "zeds", "zees", "zens", "zero", "zest", "zeta", "zinc", "zing", "zion", "zips", "zits", "zone", "zonk", "zoom", "zoos", "zulu",
    # 5 letter words
    "about", "above", "abuse", "actor", "acute", "admit", "adopt", "adult", "after", "again", "agent", "agree", "ahead", "alarm", "album", "alert", "alien", "align", "alike", "alive", "allow", "alone", "along", "alter", "angel", "anger", "angle", "angry", "apart", "apple", "apply", "arena", "argue", "arise", "array", "arrow", "aside", "asset", "audio", "avoid", "awake", "award", "aware", "badly",
    "baker", "bases", "basic", "basin", "basis", "beach", "began", "begin", "being", "below", "bench", "billy", "birth", "black", "blade", "blame", "blank", "blind", "block", "blood", "blown", "board", "boost", "booth", "bound", "brain", "brand", "brave", "bread", "break", "breed", "brief", "bring", "broad", "broke", "brown", "build", "built", "buyer",
    "cable", "calif", "carry", "catch", "cause", "chain", "chair", "chart", "chase", "cheap", "check", "chest", "chief", "child", "china", "chose", "civil", "claim", "class", "clean", "clear", "click", "cliff", "climb", "clock", "close", "cloud", "coach", "coast", "could", "count", "court", "cover", "crack", "craft", "crash", "crazy", "cream", "crime", "cross", "crowd", "crown", "crude", "curve", "cycle",
    "daily", "dance", "dated", "dealt", "death", "debut", "delay", "delta", "dense", "depot", "depth", "doing", "doubt", "dozen", "draft", "drama", "drank", "drawn", "dream", "dress", "drill", "drink", "drive", "drove", "dying",
    "eager", "early", "earth", "eight", "elect", "empty", "enemy", "enjoy", "enter", "entry", "equal", "error", "event", "every", "exact", "exist", "extra",
    "faith", "false", "fancy", "fatal", "fault", "fiber", "field", "fifth", "fifty", "fight", "final", "first", "fixed", "flash", "fleet", "floor", "fluid", "focus", "force", "forth", "forty", "forum", "found", "frame", "frank", "fraud", "fresh", "front", "fruit", "fully",
    "gender", "given", "glass", "globe", "going", "grace", "grade", "grand", "grant", "grass", "great", "green", "gross", "group", "grown", "guard", "guess", "guest", "guide", "guilty",
    "happy", "harry", "heart", "heavy", "henry", "horse", "hotel", "house", "human",
    "ideal", "image", "imply", "index", "inner", "input", "issue",
    "japan", "jimmy", "joint", "jones", "judge",
    "known",
    "label", "large", "laser", "later", "laugh", "layer", "learn", "lease", "least", "leave", "legal", "lemon", "level", "lewis", "light", "limit", "links", "lives", "local", "logic", "loose", "lower", "lucky", "lunch",
    "machine", "magic", "major", "maker", "march", "maria", "match", "maybe", "mayor", "meant", "media", "metal", "might", "minor", "minus", "mixed", "model", "money", "month", "moral", "motor", "mount", "mouse", "mouth", "movie", "music",
    "needs", "never", "newly", "night", "noise", "north", "noted", "novel",
    "occur", "ocean", "offer", "often", "order", "other", "ought", "outer", "owner",
    "package", "pages", "paint", "panel", "paper", "party", "pasta", "patch", "pause", "peace", "peter", "phase", "phone", "photo", "piano", "piece", "pilot", "pitch", "place", "plain", "plane", "plant", "plate", "plaza", "please", "pleasure", "pocket", "point", "police", "policy", "power", "press", "price", "pride", "prime", "print", "prior", "prize", "proof", "proud", "prove", "queen", "quick", "quiet", "quite", "quote",
    "radio", "raise", "range", "rapid", "ratio", "reach", "ready", "refer", "relax", "reply", "right", "rival", "river", "robin", "roger", "roman", "rough", "round", "route", "royal", "rural",
    "scale", "scene", "scope", "score", "sense", "serve", "seven", "shall", "shape", "share", "sharp", "sheet", "shelf", "shell", "shift", "shine", "shirt", "shock", "shoot", "shore", "short", "shown", "sight", "silly", "since", "sixth", "sixty", "sized", "skill", "sleep", "slide", "small", "smart", "smile", "smith", "smoke", "solid", "solve", "sorry", "sound", "south", "space", "spare", "speak", "speed", "spend", "spent", "split", "spoke", "sport", "staff", "stage", "stake", "stand", "start", "state", "steam", "steel", "steep", "stick", "still", "stock", "stone", "stood", "store", "storm", "story", "strip", "stuck", "study", "stuff", "style", "sugar", "suite", "sunny", "super", "sweet", "sword",
    "table", "taken", "taste", "taxes", "teach", "texas", "thank", "theft", "their", "theme", "there", "these", "thick", "thing", "think", "third", "thirty", "those", "three", "threw", "throw", "tight", "times", "title", "today", "topic", "total", "touch", "tough", "tower", "track", "trade", "train", "trait", "trash", "treat", "trend", "trial", "tribe", "trick", "tried", "tries", "troop", "truck", "truly", "trump", "trust", "truth", "twice", "uncle", "under", "undue", "union", "unity", "until", "upper", "upset", "urban", "usage", "usual", "valid", "value", "video", "virus", "visit", "vital", "vocal", "voice", "waste", "watch", "water", "wheel", "where", "which", "while", "white", "whole", "whose", "woman", "women", "world", "worry", "worse", "worst", "worth", "would", "wound", "write", "wrong", "wrote", "yield", "young", "yours", "youth",
    # 6+ letter common words for subword validation
    "castle", "planet", "stream", "master", "wonder", "forest", "garden", "island",
    "silver", "nature", "spring", "travel", "winter", "bridge", "flower", "orange",
    "golden", "friend", "doctor", "person", "school", "father", "mother", "yellow",
    "window", "animal", "bottle", "pencil", "market", "church", "sister", "summer",
    "farmer", "guitar", "rocket", "pocket", "candle", "secret", "energy", "monkey",
    "turtle", "wizard", "dragon", "knight", "pirate", "circus", "violin", "falcon",
    "palace", "hunter", "prince", "shadow", "banner", "danger", "temple", "anchor",
    "fabric", "jungle", "meteor", "canyon", "desert", "oxygen", "copper", "velvet",
    "timber", "harbor", "legend", "puddle", "magnet", "powder", "shield", "statue",
    "vector", "blanket", "organic", "sunlight", "rainbow", "volcano", "weather",
    "problem", "student", "teacher", "crystal", "cartoon", "fantasy", "graphic",
    "harvest", "monster", "network", "balance", "captain", "journey", "whisper",
    "diamond", "feather", "kitchen", "lantern", "morning", "mystery", "package",
    "quarter", "station", "thunder", "village", "painter", "freedom", "pyramid",
    "universal", "elephant", "abstract", "electric", "internet", "keyboard",
    "language", "triangle", "question", "umbrella", "champion", "creature",
    "treasure", "mountain", "calendar", "hospital", "dinosaur", "painting",
    "building", "daughter", "sunshine", "midnight", "firework", "starlight"
}

def can_form_word(main_word: str, sub_word: str) -> bool:
    """Check if sub_word can be formed from letters in main_word using O(M + N) multiset frequency check"""
    main_counts = Counter(main_word.lower().strip())
    sub_counts = Counter(sub_word.lower().strip())
    for char, count in sub_counts.items():
        if main_counts[char] < count:
            return False
    return True

async def check_dictionary(word: str) -> bool:
    """Check if word exists in local dictionary or external dictionary API"""
    w = word.lower().strip()
    # Tier 1: In-memory O(1) hash set lookup
    if w in VALID_WORDS:
        return True
    
    # Tier 2: Free external dictionary API with 3.0s timeout
    try:
        async with httpx.AsyncClient() as http_client:
            response = await http_client.get(
                f"https://api.dictionaryapi.dev/api/v2/entries/en/{w}",
                timeout=3.0
            )
            if response.status_code == 200:
                VALID_WORDS.add(w)  # Dynamically cache verified word
                return True
    except Exception:
        pass
    return False

def generate_subwords(main_word: str, min_length: int = 3) -> List[str]:
    """Generate all valid subwords from main_word using local dictionary"""
    main_word = main_word.lower().strip()
    subwords = []
    for word in VALID_WORDS:
        if min_length <= len(word) <= len(main_word):
            if can_form_word(main_word, word):
                subwords.append(word)
    return subwords
