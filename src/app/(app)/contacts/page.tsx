import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { ContactsClient } from "@/components/contacts-client";

export default async function ContactsPage() {
  const userId = await getCurrentUserId();

  const contacts = userId
    ? await prisma.contact.findMany({
        where: { ownerId: userId },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return <ContactsClient contacts={contacts} />;
}
