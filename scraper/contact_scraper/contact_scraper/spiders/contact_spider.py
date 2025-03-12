import html
import os
import re
from bs4 import BeautifulSoup
import pandas as pd
import scrapy
from scrapy.utils.project import get_project_settings

from contact_scraper.items import ContactScraperItem


class ContactSpider(scrapy.Spider):
    name = "contacts"

    # Regex patterns for phone numbers
    PHONE_PATTERN = re.compile(r'(?:\s>)(\(?\d{3}\)?[\s\.-]?\d{3}[\s\.-]?\d{4})(?:\s<)')
    TEL_LINK_PATTERN = re.compile(r'(\(?\d{3}\)?[\s\.-]?\d{3}[\s\.-]?\d{4})')

    # Regex pattern for Facebook URLs
    FACEBOOK_PATTERN = re.compile(r'(?:https?:\/\/)?(?:www\.)?(?:facebook|fb)\.(?:com|me)\/(?:(?:\w\.)*#!\/)?(?:pages\/)?(?:[\w\-\.]*\/)*(?:[\w\-\.]*)')
    
    # Regex for address (can handle separators like | and HTML entities)
    ADDRESS_PATTERN = re.compile(r'(\d{1,5})\s([A-Za-z0-9\s]+)\s*(?:[\|]?\s*)?([A-Za-z\s]+),\s([A-Za-z]{2,3})\s(\d{5}(?:-\d{4})?)')

    def __init__(self, *args, **kwargs):
        super(ContactSpider, self).__init__(*args, **kwargs)

        # Access CSV directory and filename from settings
        settings = get_project_settings()
        csv_dir = settings.get('CSV_DIR_PATH')
        csv_filename = settings.get('CSV_DOMAIN_FILENAME')

        # Validate CSV directory and filename
        if not csv_dir:
            self.log('ERROR: CSV directory is not defined in settings.', level=scrapy.log.ERROR)
            raise ValueError('CSV directory is not set in settings.')
        if not csv_filename:
            self.log('ERROR: CSV filename is not defined in settings.', level=scrapy.log.ERROR)
            raise ValueError('CSV filename is not set in settings.')
        
        # Build the full path to the CSV file
        self.csv_file_path = os.path.join(csv_dir, csv_filename)

        # Validates file existence
        if not os.path.exists(self.csv_file_path):
            self.log(f"CSV file not found at {self.csv_file_path}")
            raise FileNotFoundError(f"CSV file not found: {self.csv_file_path}")

    def start_requests(self):
        try:
            companies_df = pd.read_csv(self.csv_file_path)
        except Exception as e:
            self.log(f"Error reading CSV file: {e}", level=scrapy.log.ERROR)
            return

        for index, row in companies_df.iterrows():
            url = f'https://{row['domain']}'
            yield scrapy.Request(url, self.parse_main_page, cb_kwargs=dict(domain=row['domain']))

    def parse_main_page(self, response, domain):
        """
        Parses the main page of a website to extract contact information such as phone number, address, and Facebook link.
        Args:
            response (scrapy.http.Response): The response object containing the HTML content of the main page.
            domain (str): The domain of the website being scraped.
        Yields:
            ContactScraperItem: An item containing the extracted contact information.
        
        The method performs the following steps:
        1. Extracts phone number, address, and Facebook link from the main page.
        2. If any data is missing, attempts to extract it from the raw HTML of the main page.
        3. If data is still missing, searches for "Contact Us" or "About Us" links and follows them to extract the information.
        4. If data is still missing after following the links, logs a message and yields the item with the available data.
        5. If data is found, yields the item with the extracted information.
        """

        item = ContactScraperItem()
        item['domain'] = domain
        item['website'] = response.url
        item['url'] = response.url

        phone_number, address, facebook_url = self.extract_data(response)
        item['phone_number'] = phone_number
        item['address'] = address
        item['facebook_url'] = facebook_url

        # If data is missing, check the raw HTML of the main page
        if not phone_number or not address or not facebook_url:
                phone_number, address, facebook_url = self.extract_data_from_raw_html(response.text)
                item['phone_number'] = phone_number or item['phone_number']
                item['address'] = address or item['address']
                item['facebook_url'] = facebook_url or item['facebook_url']
        
        # If data is still missing, check "Contact Us" or "About Us" pages
        if not phone_number or not address or not facebook_url:
            self.log(f"Data missing on {response.url}. Looking for 'Contact Us' or 'About Us' links.")
            contact_links = response.css('a::attr(href)').re(r'.*(?:contact|about)[\w\-]*', re.IGNORECASE)
            for link in contact_links:
                yield response.follow(link, self.parse_contact_page, meta={'item': item})
 
        yield item

    def parse_contact_page(self, response):
        """
        Parses the contact page to extract contact information such as phone number, address, and Facebook link.
        Args:
            response (scrapy.http.Response): The response object containing the HTML content of the contact page.
        Returns:
            scrapy.Item: The item object updated with the extracted contact information.

        The method performs the following steps:
        1. Retrieves the item from the response meta.
        2. Extracts the phone number, address, and Facebook link from the contact/about page.
        3. If any data is missing, attempts to extract the data from the raw HTML.
        4. Updates the item with the extracted data.
        5. Yields the updated item.
        """

        item = response.meta['item']  # Retrieve the item from the response meta
        item['url'] = response.url
        phone_number, address, facebook_url = self.extract_data(response)

        # If data is missing from the contact page, check the raw HTML
        if not phone_number or not address or not facebook_url:
            phone_number, address, facebook_url = self.extract_data_from_raw_html(response.text)
        
        # Update the item with data from the contact/about page
        item['phone_number'] = phone_number or item['phone_number']
        item['address'] = address or item['address']
        item['facebook_url'] = facebook_url or item['facebook_url']

        # Return the item with the data collected
        yield item

    def extract_data(self, response):
        # Function to extract phone number, address, and social media
        phone_number = self.extract_phone_number(response)
        address = self.extract_address(response)
        social_media = self.extract_facebook_url(response)

        return phone_number, address, social_media

    def extract_data_from_raw_html(self, raw_html):
        # Parse the HTML and extract the text
        soup = BeautifulSoup(raw_html, 'html.parser')  # Use the default HTML parser
        
        # Extract all the text, cleaning up extra spaces
        raw_text = soup.get_text(separator=' ', strip=True)
        
        # Replace HTML entities (e.g., &nbsp; -> " ")
        clean_text = html.unescape(raw_text)

        # Function to extract phone number, address, and social media from raw HTML (footer)
        phone_number = self.extract_phone_number_from_raw_html(clean_text)
        address = self.extract_address_from_raw_html(clean_text)
        facebook_url = self.extract_facebook_url_from_raw_html(raw_html)

        return phone_number, address, facebook_url


    def extract_phone_number(self, response):
        # Extracts phone numbers from the given response.
        # This method looks for phone numbers in 'tel:' links and div elements with class 'phone'.
        # It removes duplicates, strips whitespace, and validates the phone numbers using a regex pattern.
        # Returns q list of extracted phone numbers, or None if no phone numbers are found.

        phone_numbers = response.xpath('//a[starts-with(@href, "tel:")]/text()').getall()
        if not phone_numbers:
            phone_numbers = response.xpath('//div[contains(@class, "phone")]/text()').getall()

        if not phone_numbers:
            return None
        
        phone_numbers = list(set(phone_numbers))
        phone_numbers = [phone.strip() for phone in phone_numbers if phone.strip()]
        phone_numbers = [phone for phone in phone_numbers if self.TEL_LINK_PATTERN.match(phone)]
        return phone_numbers
        
    
    def extract_address(self, response):
        address = response.xpath('//address//text() | //div[contains(@class, "address")]//text() | //span[contains(@class, "address")]//text()').getall()
        address = ' '.join(address).strip() if address else None
        return address

    def extract_facebook_url(self, response):
        facebook_url = response.css('a[href*="facebook.com"]').xpath('@href').extract_first()
        return facebook_url
    
    def extract_phone_number_from_raw_html(self, raw_html):
        phone_match = self.PHONE_PATTERN.search(raw_html)
        if phone_match:
            return [phone_match.group(0)]
        return None
    
    def extract_address_from_raw_html(self, raw_html):
        address_match = self.ADDRESS_PATTERN.search(raw_html)
        address = {
            'house_number': address_match.group(1).strip(),
            'street_name': address_match.group(2).strip(),
            'city': address_match.group(3).strip(),
            'state': address_match.group(4).strip(),
            'postal_code': address_match.group(5).strip()
        } if address_match else None

        address = ' '.join([value for value in address.values() if value]) if address else None
        return address

    def extract_facebook_url_from_raw_html(self, raw_html):
        facebook_url_match = self.FACEBOOK_PATTERN.search(raw_html)
        if facebook_url_match:
            return facebook_url_match.group(0)
        return None