#!/bin/bash
cd /root/ultracreators/discord-bot

# Backup original file
cp multi-team-ticketing-bot.js multi-team-ticketing-bot.js.backup

# Add database saves after activeTickets.set calls
sed -i '613 a\        if (global.saveTicketToDB) await global.saveTicketToDB(ticket);' multi-team-ticketing-bot.js
sed -i '631 a\            if (global.saveTicketToDB) await global.saveTicketToDB(ticket);' multi-team-ticketing-bot.js  
sed -i '662 a\        if (global.saveTicketToDB) await global.saveTicketToDB(ticket);' multi-team-ticketing-bot.js
sed -i '684 a\        if (global.saveTicketToDB) await global.saveTicketToDB(ticket);' multi-team-ticketing-bot.js
sed -i '746 a\        if (global.saveTicketToDB) { await global.saveTicketToDB(primaryTicket); await global.saveTicketToDB(duplicateTicket); }' multi-team-ticketing-bot.js
sed -i '1210 a\    if (global.saveTicketToDB) await global.saveTicketToDB(ticket);' multi-team-ticketing-bot.js
sed -i '1293 a\    if (global.saveTicketToDB) await global.saveTicketToDB(ticket);' multi-team-ticketing-bot.js

# Add database updates after status changes
sed -i '1353 a\    if (global.updateTicketStatus) await global.updateTicketStatus(ticketId, '\''progress'\'', { assignee: userId, assignedAt: new Date() });' multi-team-ticketing-bot.js
sed -i '1541 a\            if (global.updateTicketStatus) await global.updateTicketStatus(ticketId, '\''progress'\'');' multi-team-ticketing-bot.js
sed -i '1549 a\            if (global.updateTicketStatus) await global.updateTicketStatus(ticketId, '\''resolved'\'', { resolvedAt: new Date() });' multi-team-ticketing-bot.js
sed -i '1557 a\            if (global.updateTicketStatus) await global.updateTicketStatus(ticketId, '\''open'\'');' multi-team-ticketing-bot.js

echo "✅ Patch applied successfully!"
echo "Backup saved as: multi-team-ticketing-bot.js.backup"
