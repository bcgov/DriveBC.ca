import asyncio
from django.core.management.base import BaseCommand

from apps.consumer.db import init_db, load_index_from_db
from apps.consumer.processor import run_consumer

class Command(BaseCommand):
    help = "Run the RabbitMQ image consumer."

    def handle(self, *args, **options):
        asyncio.run(self._async_main())

    async def _async_main(self):
        db_pool = await init_db()
        # Optional preload index into cache, etc.
        await run_consumer(db_pool)
