"""JCV Printing website imagery. GPT Image 2 on FAL (own FAL_KEY), quality medium.
Logo is NEVER invented: refs use the real logo via img2img (edit endpoint).
Usage: python3 gen.py all | python3 gen.py hero wraps [--force]
"""
import json, sys, time, urllib.request, urllib.error
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor

ROOT = Path(__file__).parent; RAW = ROOT / "raw"; RAW.mkdir(exist_ok=True)
KEY = [l.split("=", 1)[1].strip().strip('"\'') for l in open("/opt/data/.env") if l.startswith("FAL_KEY=")][0]
LOGO = "https://raw.githubusercontent.com/bunkercreativomx-maker/jcv-printing/2a52e22c98b915b95f92db154cdb6940e6c1c167/ref/logo-ref.png"

MASTER = """Ultra-photorealistic commercial product photography for the website of JCV Printing, a custom print shop in El Paso, Texas (banners, signs, vehicle wraps, t-shirts, flyers, business cards, decals, window perf).
LOOK: crisp studio-quality lighting, shot on a full-frame camera, true-to-life materials (vinyl sheen, cotton texture, paper fibers, ink gloss), shallow depth of field where appropriate. Brand palette as accents: vivid violet purple (#7912C2), deep plum (#450566), hot magenta (#E6007E), cyan (#00AEEF) and a touch of orange, against clean neutral light grey, white and charcoal surroundings.
STRICT: no invented brand names, no fake logos, no random words, letters, numbers or watermarks."""

LOGO_RULE = """The attached image is the REAL JCV Printing logo (a geometric violet eagle with wings raised in a V above the black condensed wordmark "JCV PRINTING"). Wherever branding appears, reproduce THIS exact logo faithfully (same eagle shape, same purple tones, same wordmark spelling JCV PRINTING). Do not redesign it, do not add any other logo or text."""

L = (1536, 1024); SQ = (1024, 1024); P = (1024, 1280)
JOBS = {
 "hero": (L, True, "Hero still life on a seamless light grey studio sweep: a tall retractable roll-up banner stand printed with bold violet, magenta and cyan angular graphics and the JCV Printing logo; in front, a neatly folded black t-shirt with the logo printed on the chest, a fanned stack of glossy business cards and flyers with the logo, a roll of die-cut circular stickers unspooling, and a corrugated yard sign leaning at the side. Dynamic diagonal composition, slight low angle, soft long shadows, colorful reflections on the glossy floor. Premium, energetic, professional."),
 "wraps": (L, True, "A white Ford Transit high-roof cargo van fully wrapped with dynamic angular graphics in violet, magenta and cyan with halftone dot fades, the JCV Printing logo large on the side panel. Parked in front of a modern stucco commercial building in El Paso, Texas at golden hour, the Franklin Mountains softly visible in the background, warm desert light, three-quarter front view. No license plate text, no phone numbers, no other words."),
 "shirts": (SQ, True, "Custom apparel: a stack of freshly printed black and heather grey crew-neck t-shirts on a clean work table, the top shirt shows the JCV Printing logo printed crisply in violet and white; a heat press machine softly out of focus in the background, a hand smoothing the top shirt. Bright, clean print-shop light."),
 "banners": (SQ, False, "A large-format wide inkjet printer in a clean modern print shop actively printing a huge glossy vinyl banner with vivid abstract angular shapes in violet, magenta, cyan and orange, the printed banner curling out toward the camera, ink head carriage visible, cool shop lighting with a warm accent. Absolutely no text or logos on the banner, only abstract color graphics."),
 "cards": (SQ, True, "Overhead flat lay on a charcoal surface: premium thick business cards with the JCV Printing logo, some showing a violet back side, a fanned stack of glossy promotional flyers with bold violet/magenta/cyan angular graphics and the logo, a folded invitation card with a soft magenta envelope, a couple of round stickers. Crisp edges, soft directional light, subtle paper texture."),
 "decals": (SQ, False, "Close-up of a technician's gloved hand using a felt-edge squeegee to apply a large die-cut vinyl decal of bold abstract violet and magenta angular shapes onto a clean storefront glass window, transfer tape partially peeled back, reflections of a sunny street in the glass, shallow depth of field. No words or letters anywhere."),
 "shop": (P, False, "Interior of a busy, tidy small print shop counter in El Paso: a smiling Latino print technician in his 30s wearing a plain charcoal shop apron, holding up a freshly printed vibrant violet-and-cyan abstract poster proof to inspect the color, wide-format printer and shelves of vinyl rolls behind him, warm friendly light, authentic, documentary style. No readable text, no logos."),
}

def api(url, method="GET", payload=None):
    data = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(url, data=data, method=method,
        headers={"Authorization": f"Key {KEY}", "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            raw = r.read().decode(); return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"{method} {url} -> {e.code}: {e.read().decode()[:400]}")

def run(name):
    size, use_logo, scene = JOBS[name]
    out = RAW / f"{name}.png"
    if out.exists() and "--force" not in sys.argv:
        print(name, "skip"); return
    prompt = "\n\n".join([MASTER, ("" if not use_logo else LOGO_RULE), "SCENE: " + scene])
    payload = {"prompt": prompt, "image_size": {"width": size[0], "height": size[1]}, "quality": "medium", "num_images": 1, "output_format": "png"}
    endpoint = "openai/gpt-image-2"
    if use_logo:
        payload["image_urls"] = [LOGO]; endpoint += "/edit"
    q = api(f"https://queue.fal.run/{endpoint}", "POST", payload)
    for _ in range(80):
        st = api(q["status_url"])
        if st.get("status") == "COMPLETED": break
        if st.get("status") in ("FAILED", "ERROR"): raise RuntimeError(f"{name}: {st}")
        time.sleep(5)
    res = api(q["response_url"])
    url = res["images"][0]["url"]
    urllib.request.urlretrieve(url, out)
    print(name, "ok", out, flush=True)

if __name__ == "__main__":
    names = [a for a in sys.argv[1:] if not a.startswith("--")]
    if names == ["all"]: names = list(JOBS)
    with ThreadPoolExecutor(7) as ex:
        for f in [ex.submit(run, n) for n in names]:
            try: f.result()
            except Exception as e: print("ERR", e, flush=True)
