import html
import re

from bs4 import BeautifulSoup

from .base_extractor import BaseExtractor


class RawHTMLExtractor(BaseExtractor):

    PHONE_PATTERN = re.compile(r'(?:\s>)(\(?\d{3}\)?[\s\.-]?\d{3}[\s\.-]?\d{4})(?:\s<)')
    FACEBOOK_PATTERN = re.compile(r'(?:https?:\/\/)?(?:www\.)?(?:facebook|fb)\.(?:com|me)\/(?:(?:\w\.)*#!\/)?(?:pages\/)?(?:[\w\-\.]*\/)*(?:[\w\-\.]*)')
    ADDRESS_PATTERN = re.compile(r'(\d{1,5})\s([A-Za-z0-9\s]+)\s*(?:[\|]?\s*)?([A-Za-z\s]+),\s([A-Za-z]{2,3})\s(\d{5}(?:-\d{4})?)')

    def _cleanup_source(self, source): 
        return html.unescape(source)
    
    def get_text(self, source):
        return BeautifulSoup(source, 'html.parser').get_text(separator=' ', strip=True)
    
    def extract_phone_number(self, source):
        clean_text = self._cleanup_source(source)
        phone_match = self.PHONE_PATTERN.search(clean_text)
        if phone_match:
            return [phone_match.group(0)]
        return None
    
    def extract_address(self, source):
        clean_text = self._cleanup_source(source)
        address_match = self.ADDRESS_PATTERN.search(clean_text)
        address = {
            'house_number': address_match.group(1).strip(),
            'street_name': address_match.group(2).strip(),
            'city': address_match.group(3).strip(),
            'state': address_match.group(4).strip(),
            'postal_code': address_match.group(5).strip()
        } if address_match else None

        address = ' '.join([value for value in address.values() if value]) if address else None
        return address
    
    def extract_facebook_url(self, source):
        facebook_url_match = self.FACEBOOK_PATTERN.search(source)
        if facebook_url_match:
            return facebook_url_match.group(0)
        return None