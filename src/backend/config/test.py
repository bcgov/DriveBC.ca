from argparse import ArgumentParser
from typing import Any
from django.db.backends.base.base import BaseDatabaseWrapper
from django.test.runner import DiscoverRunner


class DbcRunner(DiscoverRunner):
    '''Custom test runner to allow for skipping database creation altogether.'''

    def __init__(self, *args, **kwargs):
        self.skipdb = kwargs["skipdb"]
        super().__init__(*args, **kwargs)

    @classmethod
    def add_arguments(cls, parser: ArgumentParser) -> None:
        parser.add_argument("--skipdb", action="store_true", default=False,
                            help="Don't create a test database")
        DiscoverRunner.add_arguments(parser)

    def setup_databases(self, **kwargs: Any) -> list[tuple[BaseDatabaseWrapper, str, bool]]:
        if self.skipdb:
            return
        return super().setup_databases(**kwargs)

    def teardown_databases(self, old_config: list[tuple[BaseDatabaseWrapper, str, bool]], **kwargs: Any) -> None:
        if self.skipdb:
            return
        return super().teardown_databases(old_config, **kwargs)
