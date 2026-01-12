import wikipedia
import re

# Allowed image types
VALID_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png']
EXCLUDED_IMAGE_TERMS = ['map', 'icon', 'logo', 'diagram', 'svg', 'chart', 'symbol', 'flag', 'commons-logo']

def get_images_for_disease(disease_name):
    """
    Searches Wikipedia just to find images for a specific disease.
    """
    try:
        # Search for the page
        search_results = wikipedia.search(disease_name)
        if not search_results:
            return []
            
        page = wikipedia.page(search_results[0], auto_suggest=False)
        
        images = []
        if page.images:
            for img_url in page.images:
                lower = img_url.lower()
                if any(ext in lower for ext in VALID_IMAGE_EXTENSIONS):
                    if not any(bad in lower for bad in EXCLUDED_IMAGE_TERMS):
                        # Filter to keep likely relevant photos
                        if "commons" in lower or "upload" in lower:
                            images.append(img_url)
                if len(images) >= 3: # Get top 3 images
                    break
        return images
    except:
        return []