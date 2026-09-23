import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { supabase } from '../lib/supabase.js';

const router = Router();
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

// In-memory mock storage
const mockMeetings = new Map<string, any>();

interface UserMeeting {
  userId: string;
  roomId: string;
  title: string;
  lastJoinedAt: string;
  createdAt: string;
}
const mockUserMeetings = new Map<string, UserMeeting>(); // key: `${userId}-${roomId}`

router.use(authenticate);

// POST /api/meetings
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { title } = req.body;
    const roomId = uuidv4();
    const meetingLink = `${clientUrl}/meeting/${roomId}`;
    const meetingData = {
      id: uuidv4(),
      room_id: roomId,
      title: title || 'Untitled Meeting',
      created_at: new Date().toISOString(),
      user_id: req.user?.id || 'mock-user-id',
      meeting_link: meetingLink
    };

    if (supabase) {
      const { data, error } = await supabase
        .from('meetings')
        .insert([meetingData])
        .select()
        .single();

      if (error) {
        console.error('Error creating meeting in Supabase:', error);
        return res.status(500).json({ error: 'Failed to create meeting' });
      }
      return res.status(201).json({
        id: data.id,
        roomId: data.room_id,
        title: data.title,
        createdAt: data.created_at,
        meetingLink: data.meeting_link
      });
    } else {
      mockMeetings.set(roomId, meetingData);
      const userId = req.user?.id || 'mock-user-id';
      mockUserMeetings.set(`${userId}-${roomId}`, {
        userId,
        roomId,
        title: meetingData.title,
        lastJoinedAt: meetingData.created_at,
        createdAt: meetingData.created_at
      });
      return res.status(201).json({
        id: meetingData.id,
        roomId: meetingData.room_id,
        title: meetingData.title,
        createdAt: meetingData.created_at,
        meetingLink: meetingData.meeting_link
      });
    }
  } catch (error) {
    console.error('Error in POST /api/meetings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/meetings/:roomId
router.get('/:roomId', async (req: AuthRequest, res: Response) => {
  try {
    const { roomId } = req.params;

    if (supabase) {
      const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .eq('room_id', roomId)
        .single();

      if (error) {
        return res.status(404).json({ error: 'Meeting not found' });
      }
      return res.json({
        id: data.id,
        roomId: data.room_id,
        title: data.title,
        createdAt: data.created_at,
        meetingLink: data.meeting_link
      });
    } else {
      const meeting = mockMeetings.get(roomId);
      if (!meeting) {
        return res.status(404).json({ error: 'Meeting not found' });
      }
      return res.json({
        id: meeting.id,
        roomId: meeting.room_id,
        title: meeting.title,
        createdAt: meeting.created_at,
        meetingLink: meeting.meeting_link
      });
    }
  } catch (error) {
    console.error('Error in GET /api/meetings/:roomId:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/meetings
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (supabase) {
      const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        return res.status(500).json({ error: 'Failed to fetch meetings' });
      }
      return res.json(data.map((m: any) => ({
        id: m.id,
        roomId: m.room_id,
        title: m.title,
        createdAt: m.created_at,
        meetingLink: m.meeting_link
      })));
    } else {
      const userHistory = Array.from(mockUserMeetings.values())
        .filter(m => m.userId === userId)
        .sort((a, b) => new Date(b.lastJoinedAt).getTime() - new Date(a.lastJoinedAt).getTime());

      return res.json(userHistory.map(h => {
        const globalMeeting = mockMeetings.get(h.roomId);
        return {
          id: globalMeeting?.id || h.roomId,
          roomId: h.roomId,
          title: h.title,
          createdAt: globalMeeting?.created_at || h.createdAt,
          lastJoinedAt: h.lastJoinedAt,
          meetingLink: globalMeeting?.meeting_link || `${clientUrl}/meeting/${h.roomId}`,
          status: 'ended' // Mock status
        };
      }));
    }
  } catch (error) {
    console.error('Error in GET /api/meetings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/meetings/:roomId/join
router.post('/:roomId/join', async (req: AuthRequest, res: Response) => {
  try {
    const { roomId } = req.params;
    const { title } = req.body;
    const userId = req.user?.id || 'mock-user-id';

    if (supabase) {
      // Basic fallback if Supabase is used (assuming a user_meetings table exists)
      const { error } = await supabase
        .from('user_meetings')
        .upsert({ user_id: userId, room_id: roomId, last_joined_at: new Date().toISOString() }, { onConflict: 'user_id,room_id' });
      if (error) console.warn('Supabase user_meetings insert failed, ignoring for mock fallback.', error.message);
      return res.status(200).json({ success: true });
    } else {
      const globalMeeting = mockMeetings.get(roomId);
      const existing = mockUserMeetings.get(`${userId}-${roomId}`);
      
      mockUserMeetings.set(`${userId}-${roomId}`, {
        userId,
        roomId,
        title: globalMeeting?.title || title || existing?.title || 'Meeting',
        lastJoinedAt: new Date().toISOString(),
        createdAt: existing?.createdAt || globalMeeting?.created_at || new Date().toISOString()
      });
      
      return res.status(200).json({ success: true });
    }
  } catch (error) {
    console.error('Error in POST /api/meetings/:roomId/join:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
