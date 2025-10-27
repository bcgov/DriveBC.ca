import asyncio
from django.core.management.base import BaseCommand
from apps.consumer.processor import run_consumer

class Command(BaseCommand):
    help = "Run the RabbitMQ image consumer."

    def handle(self, *args, **options):
        asyncio.run(self._async_main())

    async def _async_main(self):
        await run_consumer()