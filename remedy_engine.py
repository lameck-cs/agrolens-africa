import wikipedia
import requests
from bs4 import BeautifulSoup
import re

REMEDY_KEYWORDS = ["treat", "control", "prevent", "remedy", "management", "spray", "fungicide", "remove", "chemical", "biological"]

def get_remedies(disease_name):
    remedies = []

    try:
        page = wikipedia.page(disease_name, auto_suggest=False)
        if hasattr(page, "sections"):
            for sec in page.sections:
                if any(k.lower() in sec.lower() for k in ["control", "management", "prevention", "treatment"]):
                    content = page.section(sec)
                    if content:
                        lines = [line.strip() for line in re.split(r'\. |\.\n', content) if len(line.strip()) > 20]
                        remedies.extend(lines[:5])
        if remedies:
            return remedies
    except:
        pass

    try:
        url = f"https://en.wikipedia.org/wiki/{disease_name.replace(' ', '_')}"
        resp = requests.get(url)
        if resp.status_code == 200:
            soup = BeautifulSoup(resp.text, 'html.parser')
            paragraphs = soup.find_all('p')
            for p in paragraphs:
                text = p.get_text().strip()
                sentences = [s.strip() for s in re.split(r'\. |\.\n', text) if any(k in s.lower() for k in REMEDY_KEYWORDS)]
                remedies.extend(sentences[:5])
        if remedies:
            return remedies
    except:
        pass

    return [
        "No specific treatment found online.",
        "General recommendations: remove infected parts, isolate affected plants, consult local experts.",
        "Consider using recommended fungicides or organic control methods."
    ]
