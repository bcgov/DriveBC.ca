from django.test import TestCase
from unittest.mock import patch, MagicMock
from wagtail.models import Page
from apps.cms.models import (
    Advisory,
    AdvisoryIndexPage,
    Bulletin,
    BulletinIndexPage,
    get_or_create_advisory_index,
    get_or_create_bulletin_index,
    reparent_orphan_advisories,
    reparent_orphan_bulletins,
)


class GetOrCreateAdvisoryIndexTests(TestCase):
    """Tests for get_or_create_advisory_index()"""

    def setUp(self):
        AdvisoryIndexPage.objects.all().delete()

    # index page exists AND numchild is already correct
    def test_returns_existing_index_when_numchild_is_correct(self):
        """When an AdvisoryIndexPage exists and numchild matches reality,
        the existing page is returned without modification."""
        mock_index = MagicMock(spec=AdvisoryIndexPage)
        mock_index.numchild = 3
        mock_index.get_children.return_value.count.return_value = 3

        with patch.object(
            AdvisoryIndexPage.objects, "first", return_value=mock_index
        ):
            result = get_or_create_advisory_index()

        self.assertEqual(result, mock_index)
        mock_index.save.assert_not_called()

    
    # index page exists BUT numchild is stale / mismatched
    def test_fixes_numchild_when_stale_and_returns_index(self):
        """When an AdvisoryIndexPage exists but numchild doesn't match the
        real child count, numchild is corrected and saved before returning."""
        mock_index = MagicMock(spec=AdvisoryIndexPage)
        mock_index.numchild = 0
        mock_index.get_children.return_value.count.return_value = 5

        with patch.object(
            AdvisoryIndexPage.objects, "first", return_value=mock_index
        ):
            result = get_or_create_advisory_index()

        self.assertEqual(mock_index.numchild, 5)
        mock_index.save.assert_called_once_with(update_fields=["numchild"])
        self.assertEqual(result, mock_index)

    def test_numchild_not_saved_when_already_accurate(self):
        """save() should NOT be called when numchild already matches."""
        mock_index = MagicMock(spec=AdvisoryIndexPage)
        mock_index.numchild = 7
        mock_index.get_children.return_value.count.return_value = 7

        with patch.object(
            AdvisoryIndexPage.objects, "first", return_value=mock_index
        ):
            get_or_create_advisory_index()

        mock_index.save.assert_not_called()

    # no index page exists — must be created
    def test_creates_index_when_none_exists(self):
        """When no AdvisoryIndexPage exists, one is created under the root,
        published, and returned."""
        mock_root = MagicMock(spec=Page)
        mock_revision = MagicMock()
        mock_new_index = MagicMock(spec=AdvisoryIndexPage)
        mock_new_index.save_revision.return_value = mock_revision
    
        with patch.object(AdvisoryIndexPage.objects, "first", return_value=None), \
            patch.object(Page, "get_first_root_node", return_value=mock_root), \
            patch("apps.cms.models.AdvisoryIndexPage", autospec=False) as MockAdvisoryIndexPage:
    
            # Ensure .objects.first() still returns None inside the patched class
            MockAdvisoryIndexPage.objects.first.return_value = None
            MockAdvisoryIndexPage.return_value = mock_new_index
    
            result = get_or_create_advisory_index()
    
            MockAdvisoryIndexPage.assert_called_once_with(
                title="Advisories",
                slug="advisories",
            )
    
        mock_root.add_child.assert_called_once_with(instance=mock_new_index)
        mock_new_index.save_revision.assert_called_once()
        mock_revision.publish.assert_called_once()
        self.assertEqual(result, mock_new_index)

    def test_created_index_has_correct_title_and_slug(self):
        """Verify the created AdvisoryIndexPage is initialised with the
        expected title and slug values."""
        captured_kwargs = {}

        class CapturingAdvisoryIndexPage:
            def __init__(self, **kwargs):
                captured_kwargs.update(kwargs)
                self.save_revision = MagicMock(
                    return_value=MagicMock(publish=MagicMock())
                )

        mock_root = MagicMock(spec=Page)

        with patch.object(AdvisoryIndexPage.objects, "first", return_value=None), \
             patch.object(Page, "get_first_root_node", return_value=mock_root), \
             patch(
                 "apps.cms.models.AdvisoryIndexPage",
                 side_effect=CapturingAdvisoryIndexPage,
             ):
            get_or_create_advisory_index()

        self.assertEqual(captured_kwargs["title"], "Advisories")
        self.assertEqual(captured_kwargs["slug"], "advisories")

    def test_created_index_has_correct_title_and_slug(self):
        """Verify the created AdvisoryIndexPage is initialised with the
        expected title and slug values."""
        captured_kwargs = {}

        class CapturingAdvisoryIndexPage:
            def __init__(self, **kwargs):
                captured_kwargs.update(kwargs)
                self.save_revision = MagicMock(
                    return_value=MagicMock(publish=MagicMock())
                )

        mock_root = MagicMock(spec=Page)

        with patch.object(AdvisoryIndexPage.objects, "first", return_value=None), \
            patch.object(Page, "get_first_root_node", return_value=mock_root), \
            patch(
                "apps.cms.models.AdvisoryIndexPage",
                side_effect=CapturingAdvisoryIndexPage,
            ) as MockAdvisoryIndexPage:

            MockAdvisoryIndexPage.objects.first.return_value = None

            get_or_create_advisory_index()

        self.assertEqual(captured_kwargs["title"], "Advisories")
        self.assertEqual(captured_kwargs["slug"], "advisories")

    def test_add_child_called_with_new_index(self):
        """root.add_child() must receive the newly constructed index instance."""
        mock_root = MagicMock(spec=Page)
        mock_new_index = MagicMock(spec=AdvisoryIndexPage)
        mock_new_index.save_revision.return_value = MagicMock(publish=MagicMock())

        with patch.object(AdvisoryIndexPage.objects, "first", return_value=None), \
            patch.object(Page, "get_first_root_node", return_value=mock_root), \
            patch(
                "apps.cms.models.AdvisoryIndexPage",
                return_value=mock_new_index,
            ) as MockAdvisoryIndexPage:

            MockAdvisoryIndexPage.objects.first.return_value = None  # <-- fix

            get_or_create_advisory_index()

        mock_root.add_child.assert_called_once_with(instance=mock_new_index)



class GetOrCreateBulletinIndexTests(TestCase):
    """Tests for get_or_create_bulletin_index()"""

    def setUp(self):
        BulletinIndexPage.objects.all().delete()

    # index page exists AND numchild is already correct
    def test_returns_existing_index_when_numchild_is_correct(self):
        mock_index = MagicMock(spec=BulletinIndexPage)
        mock_index.numchild = 2
        mock_index.get_children.return_value.count.return_value = 2

        with patch.object(
            BulletinIndexPage.objects, "first", return_value=mock_index
        ):
            result = get_or_create_bulletin_index()

        self.assertEqual(result, mock_index)
        mock_index.save.assert_not_called()

    # index page exists BUT numchild is stale
    def test_fixes_numchild_when_stale_and_returns_index(self):
        mock_index = MagicMock(spec=BulletinIndexPage)
        mock_index.numchild = 1
        mock_index.get_children.return_value.count.return_value = 4

        with patch.object(
            BulletinIndexPage.objects, "first", return_value=mock_index
        ):
            result = get_or_create_bulletin_index()

        self.assertEqual(mock_index.numchild, 4)
        mock_index.save.assert_called_once_with(update_fields=["numchild"])
        self.assertEqual(result, mock_index)

    def test_numchild_not_saved_when_already_accurate(self):
        mock_index = MagicMock(spec=BulletinIndexPage)
        mock_index.numchild = 10
        mock_index.get_children.return_value.count.return_value = 10

        with patch.object(
            BulletinIndexPage.objects, "first", return_value=mock_index
        ):
            get_or_create_bulletin_index()

        mock_index.save.assert_not_called()

    # no index page exists — must be created
    def test_creates_index_when_none_exists(self):
        mock_root = MagicMock(spec=Page)
        mock_new_index = MagicMock(spec=BulletinIndexPage)
        mock_revision = MagicMock()
        mock_new_index.save_revision.return_value = mock_revision

        with patch.object(BulletinIndexPage.objects, "first", return_value=None), \
            patch.object(Page, "get_first_root_node", return_value=mock_root), \
            patch(
                "apps.cms.models.BulletinIndexPage",
                return_value=mock_new_index,
            ) as MockBulletinIndexPage:

            MockBulletinIndexPage.objects.first.return_value = None  # <-- fix

            result = get_or_create_bulletin_index()

            MockBulletinIndexPage.assert_called_once_with(
                title="Bulletins",
                slug="bulletins",
            )

        mock_root.add_child.assert_called_once_with(instance=mock_new_index)
        mock_new_index.save_revision.assert_called_once()
        mock_revision.publish.assert_called_once()
        self.assertEqual(result, mock_new_index)

    def test_created_index_has_correct_title_and_slug(self):
        captured_kwargs = {}

        class CapturingBulletinIndexPage:
            def __init__(self, **kwargs):
                captured_kwargs.update(kwargs)
                self.save_revision = MagicMock(
                    return_value=MagicMock(publish=MagicMock())
                )

        mock_root = MagicMock(spec=Page)

        with patch.object(BulletinIndexPage.objects, "first", return_value=None), \
            patch.object(Page, "get_first_root_node", return_value=mock_root), \
            patch(
                "apps.cms.models.BulletinIndexPage",
                side_effect=CapturingBulletinIndexPage,
            ) as MockBulletinIndexPage:

            MockBulletinIndexPage.objects.first.return_value = None  # <-- fix

            get_or_create_bulletin_index()

        self.assertEqual(captured_kwargs["title"], "Bulletins")
        self.assertEqual(captured_kwargs["slug"], "bulletins")

    def test_add_child_called_with_new_index(self):
        mock_root = MagicMock(spec=Page)
        mock_new_index = MagicMock(spec=BulletinIndexPage)
        mock_new_index.save_revision.return_value = MagicMock(publish=MagicMock())

        with patch.object(BulletinIndexPage.objects, "first", return_value=None), \
            patch.object(Page, "get_first_root_node", return_value=mock_root), \
            patch(
                "apps.cms.models.BulletinIndexPage",
                return_value=mock_new_index,
            ) as MockBulletinIndexPage:

            MockBulletinIndexPage.objects.first.return_value = None  # <-- fix

            get_or_create_bulletin_index()

        mock_root.add_child.assert_called_once_with(instance=mock_new_index)


class ReparentOrphanAdvisoriesTests(TestCase):
    """Tests for reparent_orphan_advisories()"""

    def setUp(self):
        Advisory.objects.all().delete()
        AdvisoryIndexPage.objects.all().delete()

    def test_no_index_page_does_nothing(self):
        """If no AdvisoryIndexPage exists, function should exit early."""
        with patch.object(AdvisoryIndexPage.objects, "first", return_value=None):
            with patch.object(Advisory.objects, "all") as mock_all:
                reparent_orphan_advisories()

        mock_all.assert_not_called()

    def test_no_orphans_no_move(self):
        """If all advisories already belong to index, no move should happen."""
        mock_index = MagicMock(spec=AdvisoryIndexPage)

        mock_parent = MagicMock()
        mock_parent.specific_class = AdvisoryIndexPage

        mock_advisory = MagicMock(spec=Advisory)
        mock_advisory.get_parent.return_value = mock_parent

        with patch.object(
            AdvisoryIndexPage.objects, "first", return_value=mock_index
        ), patch.object(
            Advisory.objects, "all", return_value=[mock_advisory]
        ):
            reparent_orphan_advisories()

        mock_advisory.move.assert_not_called()

    def test_orphan_advisory_is_moved(self):
        """Advisory not under index should be moved to index."""
        mock_index = MagicMock(spec=AdvisoryIndexPage)

        wrong_parent = MagicMock()
        wrong_parent.specific_class = MagicMock()  # not AdvisoryIndexPage

        orphan = MagicMock(spec=Advisory)
        orphan.get_parent.return_value = wrong_parent

        with patch.object(
            AdvisoryIndexPage.objects, "first", return_value=mock_index
        ), patch.object(
            Advisory.objects, "all", return_value=[orphan]
        ):
            reparent_orphan_advisories()

        orphan.move.assert_called_once_with(mock_index, pos="first-child")

    def test_only_orphans_are_moved(self):
        """Only advisories not under index should be moved."""
        mock_index = MagicMock(spec=AdvisoryIndexPage)

        # Correct parent
        correct_parent = MagicMock()
        correct_parent.specific_class = AdvisoryIndexPage

        valid = MagicMock(spec=Advisory)
        valid.get_parent.return_value = correct_parent

        # Wrong parent
        wrong_parent = MagicMock()
        wrong_parent.specific_class = MagicMock()

        orphan = MagicMock(spec=Advisory)
        orphan.get_parent.return_value = wrong_parent

        with patch.object(
            AdvisoryIndexPage.objects, "first", return_value=mock_index
        ), patch.object(
            Advisory.objects, "all", return_value=[valid, orphan]
        ):
            reparent_orphan_advisories()

        valid.move.assert_not_called()
        orphan.move.assert_called_once_with(mock_index, pos="first-child")

    def test_multiple_orphans_all_moved(self):
        """All orphan advisories should be moved."""
        mock_index = MagicMock(spec=AdvisoryIndexPage)

        wrong_parent = MagicMock()
        wrong_parent.specific_class = MagicMock()

        orphan1 = MagicMock(spec=Advisory)
        orphan1.get_parent.return_value = wrong_parent

        orphan2 = MagicMock(spec=Advisory)
        orphan2.get_parent.return_value = wrong_parent

        with patch.object(
            AdvisoryIndexPage.objects, "first", return_value=mock_index
        ), patch.object(
            Advisory.objects, "all", return_value=[orphan1, orphan2]
        ):
            reparent_orphan_advisories()

        orphan1.move.assert_called_once_with(mock_index, pos="first-child")
        orphan2.move.assert_called_once_with(mock_index, pos="first-child")


class ReparentOrphanBulletinTests(TestCase):
    """Tests for reparent_orphan_bulletins()"""

    def setUp(self):
        Bulletin.objects.all().delete()
        BulletinIndexPage.objects.all().delete()

    def test_no_index_page_does_nothing(self):
        """If no BulletinIndexPage exists, function should exit early."""
        with patch.object(BulletinIndexPage.objects, "first", return_value=None):
            with patch.object(Bulletin.objects, "all") as mock_all:
                reparent_orphan_bulletins()

        mock_all.assert_not_called()

    def test_no_orphans_no_move(self):
        """If all bulletins already belong to index, no move should happen."""
        mock_index = MagicMock(spec=BulletinIndexPage)

        mock_parent = MagicMock()
        mock_parent.specific_class = BulletinIndexPage

        mock_bulletin = MagicMock(spec=Bulletin)
        mock_bulletin.get_parent.return_value = mock_parent

        with patch.object(
            BulletinIndexPage.objects, "first", return_value=mock_index
        ), patch.object(
            Bulletin.objects, "all", return_value=[mock_bulletin]
        ):
            reparent_orphan_bulletins()

        mock_bulletin.move.assert_not_called()

    def test_orphan_bulletin_is_moved(self):
        """Bulletin not under index should be moved to index."""
        mock_index = MagicMock(spec=BulletinIndexPage)

        wrong_parent = MagicMock()
        wrong_parent.specific_class = MagicMock()  # not BulletinIndexPage

        orphan = MagicMock(spec=Bulletin)
        orphan.get_parent.return_value = wrong_parent

        with patch.object(
            BulletinIndexPage.objects, "first", return_value=mock_index
        ), patch.object(
            Bulletin.objects, "all", return_value=[orphan]
        ):
            reparent_orphan_bulletins()

        orphan.move.assert_called_once_with(mock_index, pos="first-child")

    def test_only_orphans_are_moved(self):
        """Only bulletins not under index should be moved."""
        mock_index = MagicMock(spec=BulletinIndexPage)

        # Correct parent
        correct_parent = MagicMock()
        correct_parent.specific_class = BulletinIndexPage

        valid = MagicMock(spec=Bulletin)
        valid.get_parent.return_value = correct_parent

        # Wrong parent
        wrong_parent = MagicMock()
        wrong_parent.specific_class = MagicMock()

        orphan = MagicMock(spec=Bulletin)
        orphan.get_parent.return_value = wrong_parent

        with patch.object(
            BulletinIndexPage.objects, "first", return_value=mock_index
        ), patch.object(
            Bulletin.objects, "all", return_value=[valid, orphan]
        ):
            reparent_orphan_bulletins()

        valid.move.assert_not_called()
        orphan.move.assert_called_once_with(mock_index, pos="first-child")

    def test_multiple_orphans_all_moved(self):
        """All orphan bulletins should be moved."""
        mock_index = MagicMock(spec=BulletinIndexPage)

        wrong_parent = MagicMock()
        wrong_parent.specific_class = MagicMock()

        orphan1 = MagicMock(spec=Bulletin)
        orphan1.get_parent.return_value = wrong_parent

        orphan2 = MagicMock(spec=Bulletin)
        orphan2.get_parent.return_value = wrong_parent

        with patch.object(
            BulletinIndexPage.objects, "first", return_value=mock_index
        ), patch.object(
            Bulletin.objects, "all", return_value=[orphan1, orphan2]
        ):
            reparent_orphan_bulletins()

        orphan1.move.assert_called_once_with(mock_index, pos="first-child")
        orphan2.move.assert_called_once_with(mock_index, pos="first-child")