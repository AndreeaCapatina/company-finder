import re

from .base_extractor import BaseExtractor

class ParsedHTMLExtractor(BaseExtractor):
    TEL_LINK_PATTERN = re.compile(r'(\(?\d{3}\)?[\s\.-]?\d{3}[\s\.-]?\d{4})')

    def extract_phone_number(self, source):
        phone_numbers = source.xpath('//a[starts-with(@href, "tel:")]/text()').getall()
        if not phone_numbers:
            phone_numbers = source.xpath('//div[contains(@class, "phone")]/text()').getall()

        if not phone_numbers:
            return None
        
        phone_numbers = list(set(phone_numbers))
        phone_numbers = [phone.strip() for phone in phone_numbers if phone.strip()]
        phone_numbers = [phone for phone in phone_numbers if self.TEL_LINK_PATTERN.match(phone)]
        return phone_numbers
    
    def extract_address(self, source):
        address = source.xpath('//address//text() | //div[contains(@class, "address")]//text() | //span[contains(@class, "address")]//text()').getall()
        address = ' '.join(address).strip() if address else None
        return address
    
    def extract_facebook_url(self, source):
        facebook_url = source.css('a[href*="facebook.com"]').xpath('@href').extract_first()
        return facebook_url