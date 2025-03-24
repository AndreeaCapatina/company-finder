import html
import os
import re
from bs4 import BeautifulSoup
import pandas as pd
import scrapy
from scrapy.utils.project import get_project_settings

from contact_scraper.items import ContactScraperItem
from contact_scraper.extractors.parsed_html_extractor import ParsedHTMLExtractor
from contact_scraper.extractors.raw_html_extractor import RawHTMLExtractor


class ContactSpider(scrapy.Spider):
    name = "contacts"

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

        self.parsed_html_extractor = ParsedHTMLExtractor()
        self.raw_html_extractor = RawHTMLExtractor()

    def start_requests(self):
        try:
            companies_df = pd.read_csv(self.csv_file_path)
        except Exception as e:
            self.log(f"Error reading CSV file: {e}", level=scrapy.log.ERROR)
            return

        for index, row in companies_df.iterrows():
            url = f'https://{row["domain"]}'
            yield scrapy.Request(url, self.parse_main_page, cb_kwargs=dict(domain=row['domain']))

    def parse_main_page(self, response, domain):
        item = ContactScraperItem(domain=domain, website=response.url, url=response.url)
        self.populate_item(response, item)
        
        # If data is still missing, check "Contact Us" or "About Us" pages
        if not all([item['phone_number'], item['address'], item['facebook_url']]):
            self.log(f"Data missing on {response.url}. Looking for 'Contact Us' or 'About Us' links.")
            contact_links = response.css('a::attr(href)').re(r'.*(?:contact|about)[\w\-]*', re.IGNORECASE)
            for link in contact_links:
                yield response.follow(link, self.parse_contact_page, meta={'item': item})
        else:
            yield item

    def parse_contact_page(self, response):
        item = response.meta['item']
        item['url'] = response.url
        self.populate_item(response, item)

        yield item

    def populate_item(self, response, item):
        phone, address, facebook = self.parsed_html_extractor.extract_info(response)

        if not all([phone, address, facebook]):
            raw_html_source = self.raw_html_extractor.get_text(response.text)

        # Extract only missing fields from raw HTML
        if not phone:
            phone = self.raw_html_extractor.extract_phone_number(raw_html_source)
        if not address:
            address = self.raw_html_extractor.extract_address(raw_html_source)
        if not facebook:
            facebook = self.raw_html_extractor.extract_facebook_url(raw_html_source)

        # Populate the item
        item["phone_number"] = phone or item.get("phone_number")
        item["address"] = address or item.get("address")
        item["facebook_url"] = facebook or item.get("facebook_url")