import { getUserById, getFriends } from '../database/db.js';

// Track connected users: Map<userId, Set<WebSocket>>
const connectedUsers = new Map();

// Broadcast to specific user's connections
function broadcastToUser(userId, message) {
  const connections = connectedUsers.get(userId);
  if (connections) {
    connections.forEach(ws => {
      if (ws.readyState === 1) { // OPEN
        ws.send(JSON.stringify(message));
      }
    });
  }
}

// Export for use by other modules
export function broadcastToUserById(userId, message) {
  broadcastToUser(userId, message);
}

// Notify friends about status change
async function notifyFriendsAboutStatus(userId, isOnline) {
  try {
    const friends = await getFriends(userId);
    friends.forEach(friend => {
      broadcastToUser(friend.id, {
        type: 'friend_status_change',
        friendId: userId,
        isOnline: isOnline
      });
    });
  } catch (err) {
    console.error('Error notifying friends:', err);
  }
}

// Send current status of all friends to a user
async function sendFriendStatuses(userId) {
  try {
    const friends = await getFriends(userId);
    const statuses = friends.map(friend => ({
      friendId: friend.id,
      isOnline: connectedUsers.has(friend.id)
    }));
    
    broadcastToUser(userId, {
      type: 'friend_statuses_initial',
      statuses: statuses
    });
  } catch (err) {
    console.error('Error sending friend statuses:', err);
  }
}

export async function presenceRoutes(fastify) {
  fastify.get('/api/presence', { websocket: true }, async (connection, req) => {
    // Authenticate via session
    if (!req.session.userId) {
      connection.socket.send(JSON.stringify({ type: 'error', message: 'Unauthorized' }));
      connection.socket.close();
      return;
    }

    const userId = req.session.userId;
    const user = await getUserById(userId);
    
    if (!user) {
      connection.socket.send(JSON.stringify({ type: 'error', message: 'User not found' }));
      connection.socket.close();
      return;
    }

    // Add to connected users
    if (!connectedUsers.has(userId)) {
      connectedUsers.set(userId, new Set());
    }
    connectedUsers.get(userId).add(connection.socket);

    // Send confirmation
    connection.socket.send(JSON.stringify({ type: 'authenticated', userId: userId }));

    // Send initial friend statuses
    await sendFriendStatuses(userId);

    // Notify friends that user is now online
    await notifyFriendsAboutStatus(userId, true);

    connection.socket.on('message', async (message) => {
      try {
        // Handle other messages if needed
        // Previously we only handled 'auth'
      } catch (err) {
        console.error('WebSocket message error:', err);
      }
    });

    connection.socket.on('close', async () => {
      // Remove from connected users
      const connections = connectedUsers.get(userId);
      if (connections) {
        connections.delete(connection.socket);
        
        // If no more connections, user is offline
        if (connections.size === 0) {
          connectedUsers.delete(userId);
          // Notify friends that user is now offline
          await notifyFriendsAboutStatus(userId, false);
        }
      }
    });

    connection.socket.on('error', (err) => {
      console.error('WebSocket error:', err);
    });
  });
}
