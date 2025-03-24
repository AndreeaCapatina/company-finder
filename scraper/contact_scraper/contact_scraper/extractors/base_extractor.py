import re

class BaseExtractor:

    def extract_info(self, source):
        return (
            self.extract_phone_number(source),
            self.extract_address(source),
            self.extract_facebook_url(source)
        )
    
    @staticmethod
    def extract_phone_number(source):
        raise NotImplementedError

    @staticmethod
    def extract_address(source):
        raise NotImplementedError

    @staticmethod
    def extract_facebook_url(source):
        raise NotImplementedError
