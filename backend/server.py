from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime
import random
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Word list for random generation (min 5 letters)
WORD_LIST = [
    "apple", "bread", "create", "dragon", "elephant", "flower", "garden",
    "hearts", "island", "jungle", "kitchen", "lemon", "master", "nature",
    "orange", "planet", "question", "random", "stream", "trainer",
    "umbrella", "village", "window", "crystal", "abstract", "blanket",
    "cartoon", "desktop", "electric", "fantasy", "graphic", "harvest",
    "internet", "keyboard", "language", "monster", "network", "organic",
    "picture", "quality", "rainbow", "sunlight", "triangle", "universal",
    "volcano", "weather", "problem", "student", "teacher", "friends"
]

# Define Models
class Game(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    main_word: str
    player1_name: str
    player2_name: str
    current_player: int = 1  # 1 or 2
    player1_words: List[dict] = []  # {word, valid, points}
    player2_words: List[dict] = []
    player1_score: int = 0
    player2_score: int = 0
    status: str = "active"  # active, finished
    round: int = 1
    mode: str = "pvp"  # pvp or pvc (player vs computer)
    difficulty: Optional[str] = None  # easy, medium, hard (for pvc mode)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class GameCreate(BaseModel):
    player1_name: str
    player2_name: str
    mode: str = "pvp"
    difficulty: Optional[str] = None

class WordSubmit(BaseModel):
    game_id: str
    word: str
    player: int

class SwitchTurn(BaseModel):
    game_id: str

class WordValidation(BaseModel):
    word: str
    main_word: str

class ComputerTurn(BaseModel):
    game_id: str
    difficulty: str

# Helper function to validate if word can be formed from main word
def can_form_word(main_word: str, sub_word: str) -> bool:
    """Check if sub_word can be formed from letters in main_word"""
    main_letters = list(main_word.lower())
    for letter in sub_word.lower():
        if letter in main_letters:
            main_letters.remove(letter)
        else:
            return False
    return True

# Helper function to check dictionary API
async def check_dictionary(word: str) -> bool:
    """Check if word exists in dictionary using free API"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://api.dictionaryapi.dev/api/v2/entries/en/{word}",
                timeout=5.0
            )
            return response.status_code == 200
    except:
        return False

@api_router.get("/")
async def root():
    return {"message": "Word Game API"}

@api_router.post("/game/create")
async def create_game(input: GameCreate):
    """Create a new game with random word"""
    # Generate random word (min 5 letters)
    main_word = random.choice(WORD_LIST)
    
    game_dict = {
        "id": str(uuid.uuid4()),
        "main_word": main_word,
        "player1_name": input.player1_name,
        "player2_name": input.player2_name,
        "current_player": 1,
        "player1_words": [],
        "player2_words": [],
        "player1_score": 0,
        "player2_score": 0,
        "status": "active",
        "round": 1,
        "mode": input.mode,
        "difficulty": input.difficulty,
        "created_at": datetime.utcnow()
    }
    
    await db.games.insert_one(game_dict)
    game_dict.pop('_id', None)  # Remove MongoDB ObjectId before returning
    return game_dict

@api_router.get("/game/{game_id}")
async def get_game(game_id: str):
    """Get game state"""
    game = await db.games.find_one({"id": game_id})
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    game.pop('_id', None)  # Remove MongoDB ObjectId before returning
    return game

@api_router.post("/game/submit-word")
async def submit_word(input: WordSubmit):
    """Submit a word for validation"""
    game = await db.games.find_one({"id": input.game_id})
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    
    word = input.word.lower().strip()
    main_word = game["main_word"].lower()
    
    # Validation checks
    if len(word) < 3:
        return {"valid": False, "reason": "Word must be at least 3 letters", "points": 0}
    
    # Check if word can be formed from main word
    if not can_form_word(main_word, word):
        return {"valid": False, "reason": "Word cannot be formed from main word", "points": 0}
    
    # Check if word already submitted by this player
    player_words = game[f"player{input.player}_words"]
    if any(w["word"] == word for w in player_words):
        return {"valid": False, "reason": "Word already submitted", "points": 0}
    
    # Check dictionary
    is_valid = await check_dictionary(word)
    points = len(word) if is_valid else 0
    
    # Add word to player's list
    word_entry = {"word": word, "valid": is_valid, "points": points}
    player_words.append(word_entry)
    
    # Update score
    new_score = game[f"player{input.player}_score"] + points
    
    await db.games.update_one(
        {"id": input.game_id},
        {
            "$set": {
                f"player{input.player}_words": player_words,
                f"player{input.player}_score": new_score
            }
        }
    )
    
    return {"valid": is_valid, "reason": "Valid word!" if is_valid else "Word not found in dictionary", "points": points}

@api_router.post("/game/switch-turn")
async def switch_turn(input: SwitchTurn):
    """Switch to next player"""
    game = await db.games.find_one({"id": input.game_id})
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    
    current = game["current_player"]
    next_player = 2 if current == 1 else 1
    new_round = game["round"] + 1
    
    # If both players have played, game is finished
    status = "finished" if new_round > 2 else "active"
    
    await db.games.update_one(
        {"id": input.game_id},
        {
            "$set": {
                "current_player": next_player,
                "round": new_round,
                "status": status
            }
        }
    )
    
    return {"success": True, "next_player": next_player, "status": status}

@api_router.post("/validate-word")
async def validate_word(input: WordValidation):
    """Validate a single word"""
    word = input.word.lower().strip()
    main_word = input.main_word.lower()
    
    if not can_form_word(main_word, word):
        return {"valid": False, "reason": "Cannot be formed from main word"}
    
    is_valid = await check_dictionary(word)
    return {"valid": is_valid, "reason": "Valid!" if is_valid else "Not in dictionary"}

# Common valid English words (expanded dictionary)
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
    "zany", "zaps", "zeal", "zebu", "zeds", "zees", "zens", "zero", "zest", "zeta", "zinc", "zing", "zion", "zips", "zits", "zone", "zonk", "zoom", "zoos", "zulu", "zulu",
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
}

# Helper function to generate all possible subwords
def generate_subwords(main_word: str, min_length: int = 3) -> List[str]:
    """Generate valid subwords from main_word using local dictionary - optimized approach"""
    main_word = main_word.lower()
    main_letters = list(main_word)
    subwords = []
    
    # Check all words in our dictionary to see if they can be formed from main_word
    for word in VALID_WORDS:
        if len(word) >= min_length and len(word) <= len(main_word):
            # Check if this word can be formed from main_word letters
            if can_form_word(main_word, word):
                subwords.append(word)
    
    return subwords

@api_router.post("/game/computer-turn")
async def computer_turn(input: ComputerTurn):
    """Generate computer's words based on difficulty"""
    game = await db.games.find_one({"id": input.game_id})
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    
    main_word = game["main_word"]
    difficulty = input.difficulty.lower()
    
    # Generate all valid subwords using local dictionary
    valid_words = generate_subwords(main_word, min_length=3)
    
    # Sort by length for difficulty filtering
    valid_words.sort(key=lambda x: len(x))
    
    # Separate words by length for better filtering
    short_words = [w for w in valid_words if len(w) <= 4]  # 3-4 letters
    long_words = [w for w in valid_words if len(w) >= 5]   # 5+ letters
    
    # Filter based on difficulty
    selected_words = []
    if difficulty == "easy":
        # Easy: 3-5 short words (3-4 letters only)
        target_count = min(5, max(3, len(short_words)))
        selected_words = short_words[:target_count]
    elif difficulty == "medium":
        # Medium: 5-8 words, mix of lengths (prefer some long words)
        target_count = min(8, max(5, len(valid_words)))
        # Try to get 60% short, 40% long for variety
        short_target = min(len(short_words), int(target_count * 0.6))
        long_target = min(len(long_words), target_count - short_target)
        selected_words = short_words[:short_target] + long_words[:long_target]
        # If we don't have enough, fill with remaining words
        if len(selected_words) < target_count:
            remaining = [w for w in valid_words if w not in selected_words]
            selected_words.extend(remaining[:target_count - len(selected_words)])
    else:  # hard
        # Hard: 8-12 words, prefer longer words
        target_count = min(12, max(8, len(valid_words)))
        # Prioritize long words even more (try for 80% long if available)
        long_target = min(len(long_words), max(int(target_count * 0.8), min(8, len(long_words))))
        short_target = min(len(short_words), target_count - long_target)
        selected_words = long_words[:long_target] + short_words[:short_target]
        # If we don't have enough, fill with any remaining words
        if len(selected_words) < target_count:
            remaining = [w for w in valid_words if w not in selected_words]
            selected_words.extend(remaining[:target_count - len(selected_words)])
        # Ensure minimum count of 8
        if len(selected_words) < 8:
            # If we can't meet minimum, take all available words
            selected_words = valid_words[:min(12, len(valid_words))]
    
    # Prepare word entries
    computer_words = []
    total_score = 0
    for word in selected_words:
        word_entry = {"word": word, "valid": True, "points": len(word)}
        computer_words.append(word_entry)
        total_score += len(word)
    
    return {
        "words": computer_words,
        "total_score": total_score,
        "count": len(computer_words)
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
