import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { supabase } from '../lib/supabase.js';

const router = Router();
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

// In-memory mock storage
const mockMeetings = new Map<string, any>();

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
      return res.json(data.map(m => ({
        id: m.id,
        roomId: m.room_id,
        title: m.title,
        createdAt: m.created_at,
        meetingLink: m.meeting_link
      })));
    } else {
      const userMeetings = Array.from(mockMeetings.values()).filter(m => m.user_id === userId);
      return res.json(userMeetings.map(m => ({
        id: m.id,
        roomId: m.room_id,
        title: m.title,
        createdAt: m.created_at,
        meetingLink: m.meeting_link
      })));
    }
  } catch (error) {
    console.error('Error in GET /api/meetings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
