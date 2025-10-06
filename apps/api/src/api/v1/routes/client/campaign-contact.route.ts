import { Router } from "express";
import { protect } from "../../../../middleware/auth.middleware";
import {
  uploadContacts,
  uploadMiddleware,
  getContacts,
  deleteContact,
  updateContact,
} from "../../controllers/client/campaign-contact.controller";

const router: Router = Router();

router.use(protect("client"));

// Campaign contact routes
router.post("/:campaignId/contacts/upload", uploadMiddleware, uploadContacts);
router.get("/:campaignId/contacts", getContacts);
router.delete("/:campaignId/contacts/:contactId", deleteContact);
router.patch("/:campaignId/contacts/:contactId", updateContact);

export default router;