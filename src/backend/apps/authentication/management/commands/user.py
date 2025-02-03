from apps.authentication.models import DriveBCUser
from django.core.management.base import BaseCommand, CommandError


DETAILS = '''
  username: {username}
      name: {first_name} {last_name}
     email: {email}
   created: {date_joined}
last login: {last_login}
    active: {is_active}
     staff: {is_staff}
 superuser: {is_superuser}
  verified: {verified} (attempted: {attempted_verification})
    groups: {groups}
'''

INCOMPATIBLE = 'Mutually incompatible options specified: --{arg} and --not-{arg}'

class Command(BaseCommand):
    help = 'Review or toggle flags on users identified by email address'

    def add_arguments(self, parser):
        parser.add_argument('email', )
        parser.add_argument('-d', '--details', action='store_true',
                            help='Show user info')
        parser.add_argument('-a', '--active', action='store_true',
                            help='Set active flag to true')
        parser.add_argument('-na', '--not-active', action='store_true',
                            help='Set staff flag to false')
        parser.add_argument('-s', '--staff', action='store_true',
                            help='Set staff flag to true')
        parser.add_argument('-ns', '--not-staff', action='store_true',
                            help='Set staff flag to false')
        parser.add_argument('-su', '--superuser', action='store_true',
                            help='Set superuser flag to true')
        parser.add_argument('-nsu', '--not-superuser', action='store_true',
                            help='Set superuser flag to false')

    def handle(self, *args, **options):

        try:
            user = DriveBCUser.objects.get(email=options['email'])
        except DriveBCUser.DoesNotExist:
            raise CommandError('User not found with that email address')

        if options['active'] and options['not_active']:
            raise CommandError(INCOMPATIBLE.format(arg='active'))
        if options['staff'] and options['not_staff']:
            raise CommandError(INCOMPATIBLE.format(arg='staff'))
        if options['superuser'] and options['not_superuser']:
            raise CommandError(INCOMPATIBLE.format(arg='superuser'))

        if options['active']:
            user.is_active = True
        elif options['not_active']:
            user.is_active = False

        if options['staff']:
            user.is_staff = True
        elif options['not_staff']:
            user.is_staff = False

        if options['superuser']:
            user.is_superuser = True
        elif options['not_superuser']:
            user.is_superuser = False

        if options['details']:
            groups = list(group.name for group in user.groups.all())
            print(DETAILS.format(**vars(user), groups=groups))

        user.save()
