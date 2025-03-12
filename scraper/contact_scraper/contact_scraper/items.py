# Define here the models for your scraped items
#
# See documentation in:
# https://docs.scrapy.org/en/latest/topics/items.html

import scrapy


class ContactScraperItem(scrapy.Item):
    # define the fields for your item here like:
    domain = scrapy.Field()
    url = scrapy.Field()
    website = scrapy.Field()
    phone_number = scrapy.Field()
    address = scrapy.Field()
    facebook_url = scrapy.Field()
    timestamp = scrapy.Field()

