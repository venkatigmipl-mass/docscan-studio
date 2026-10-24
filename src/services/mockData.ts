import { User, Room, GiftItem, FriendRequest, ChatMessage, ChatConversation } from '../types/chatnest';

export const INITIAL_USER: User = {
  id: 'me',
  name: 'Alex Morgan',
  handle: '@alex_nest',
  avatar: '🦊',
  age: 23,
  bio: 'Chai lover, indie music listener & tech explorer ✨ Always happy to meet friendly people!',
  language: 'en',
  interests: ['Music', 'Chai', 'Travel', 'Movies'],
  isOnline: true,
  isFriend: false,
  coins: 1250,
  city: 'Bengaluru'
};

export const INITIAL_USERS: User[] = [
  {
    id: 'user_1',
    name: 'Priya Sharma',
    handle: '@priya_vibes',
    avatar: '🌸',
    age: 22,
    bio: 'Architecture student 🏛️ | Loves acoustic covers & filter coffee | Always down for deep midnight talks.',
    language: 'hi',
    interests: ['Music', 'Art', 'Coffee', 'Photography'],
    isOnline: true,
    isFriend: true,
    coins: 540,
    city: 'Mumbai',
    storyText: 'Listening to lofi beats 🎧'
  },
  {
    id: 'user_2',
    name: 'Karthik Rajan',
    handle: '@karthik_r',
    avatar: '🎸',
    age: 25,
    bio: 'Guitarist & software dev 🎵 | Chennai payyan | Tamil cinema buff & weekend gamer.',
    language: 'ta',
    interests: ['Tamil Cinema', 'Guitar', 'Gaming', 'Tech'],
    isOnline: true,
    isFriend: true,
    coins: 890,
    city: 'Chennai',
    storyText: 'Jamming on acoustic guitar today 🎶'
  },
  {
    id: 'user_3',
    name: 'Ananya Rao',
    handle: '@ananya_spark',
    avatar: '🦋',
    age: 21,
    bio: 'Literature enthusiast 📚 | Chai > Coffee | Singing in voice rooms every evening!',
    language: 'te',
    interests: ['Books', 'Singing', 'Chai', 'Travel'],
    isOnline: true,
    isFriend: false,
    coins: 320,
    city: 'Hyderabad',
    storyText: 'Reading a mystery novel 📖'
  },
  {
    id: 'user_4',
    name: 'Arjun Kapoor',
    handle: '@arjun_fitness',
    avatar: '⚡',
    age: 24,
    bio: 'Fitness trainer & food explorer 🥗 | Podcaster | Looking for workout accountability buddies!',
    language: 'hi',
    interests: ['Fitness', 'Food', 'Podcast', 'Running'],
    isOnline: true,
    isFriend: false,
    coins: 1100,
    city: 'Delhi',
    storyText: 'Morning run done! 🏃‍♂️'
  },
  {
    id: 'user_5',
    name: 'Deepa Krishnan',
    handle: '@deepa_k',
    avatar: '🌻',
    age: 23,
    bio: 'UX Designer & doodle artist 🎨 | Cat mom 🐱 | Loves south Indian filter coffee and soulful songs.',
    language: 'ta',
    interests: ['Design', 'Cats', 'Art', 'Music'],
    isOnline: true,
    isFriend: false,
    hasIncomingRequest: true,
    coins: 670,
    city: 'Coimbatore',
    storyText: 'Doodling new stickers ✨'
  },
  {
    id: 'user_6',
    name: 'Rahul Mehta',
    handle: '@rahul_chill',
    avatar: '🎧',
    age: 26,
    bio: 'Finance by day, DJ by night 🎛️ | House & Bollywood remixes | Chill vibes only.',
    language: 'en',
    interests: ['DJ', 'Nightlife', 'Bollywood', 'Roadtrips'],
    isOnline: true,
    isFriend: false,
    coins: 1450,
    city: 'Bengaluru',
    storyText: 'New mixtape in the works 🔊'
  },
  {
    id: 'user_7',
    name: 'Sneha Nair',
    handle: '@sneha_nair',
    avatar: '🌈',
    age: 22,
    bio: 'Psychology student 🧠 | Empath | Voice room host & poetry writer ✍️',
    language: 'en',
    interests: ['Psychology', 'Poetry', 'Mindfulness', 'Cooking'],
    isOnline: true,
    isFriend: false,
    coins: 430,
    city: 'Kochi',
    storyText: 'Making masala chai ☕'
  },
  {
    id: 'user_8',
    name: 'Vikram Joshi',
    handle: '@vikram_j',
    avatar: '🚀',
    age: 27,
    bio: 'Space nerd & stargazing hobbyist 🔭 | Sci-fi movies & chess player.',
    language: 'hi',
    interests: ['Astronomy', 'Chess', 'Sci-Fi', 'Podcasts'],
    isOnline: true,
    isFriend: false,
    coins: 780,
    city: 'Pune',
    storyText: 'Looking at telescope shots 🌌'
  },
  {
    id: 'user_9',
    name: 'Divya Reddy',
    handle: '@divya_reddy',
    avatar: '✨',
    age: 24,
    bio: 'Fashion stylist & cafe hopper ☕ | Dog lover 🐕 | Loves Telugu tunes & travel vlogs.',
    language: 'te',
    interests: ['Fashion', 'Cafes', 'Dogs', 'Telugu Songs'],
    isOnline: true,
    isFriend: false,
    hasIncomingRequest: true,
    coins: 910,
    city: 'Visakhapatnam',
    storyText: 'Cafe hopping in beach road 🏖️'
  },
  {
    id: 'user_10',
    name: 'Rohan Sen',
    handle: '@rohan_sen',
    avatar: '🎮',
    age: 23,
    bio: 'Competitive gamer & streamer 🕹️ | Valorant & BGMI | Always up for voice chat during matches!',
    language: 'en',
    interests: ['Gaming', 'Streaming', 'Anime', 'Meme Culture'],
    isOnline: true,
    isFriend: false,
    coins: 520,
    city: 'Kolkata',
    storyText: 'Streaming gaming session 🎮'
  },
  {
    id: 'user_11',
    name: 'Meera Iyer',
    handle: '@meera_iyer',
    avatar: '🎨',
    age: 25,
    bio: 'Classical singer & content creator 🎤 | Bharatanatyam | Sharing positivity and laughter.',
    language: 'ta',
    interests: ['Singing', 'Dance', 'Culture', 'Stories'],
    isOnline: true,
    isFriend: false,
    coins: 1200,
    city: 'Madurai',
    storyText: 'Riyaz practice in morning 🎶'
  },
  {
    id: 'user_12',
    name: 'Aakash Verma',
    handle: '@aakash_v',
    avatar: '🦁',
    age: 28,
    bio: 'Start-up founder & storyteller 💡 | Big believer in serendipitous connections & honest talks.',
    language: 'hi',
    interests: ['Startups', 'Books', 'Philosophy', 'Travel'],
    isOnline: true,
    isFriend: false,
    coins: 1650,
    city: 'Jaipur',
    storyText: 'Brainstorming late night ideas 💡'
  }
];

export const INITIAL_ROOMS: Room[] = [
  {
    id: 'room_1',
    title: '🌸 Friendship & Chai Corner',
    topic: 'Pull up a chair, grab a cup of chai, and introduce yourself! No judgments, all good vibes.',
    category: 'Friendship',
    badge: 'Popular',
    emoji: '☕',
    bannerGradient: 'from-amber-500 via-orange-500 to-rose-500',
    language: 'Hindi & English',
    listenersCount: 148,
    speakers: [
      { id: 'sp_1', name: 'Priya S.', avatar: '🌸', isSpeaking: true, isMuted: false, isHost: true, role: 'Host' },
      { id: 'sp_2', name: 'Sneha N.', avatar: '🌈', isSpeaking: false, isMuted: false, isHost: false, role: 'Co-Host' },
      { id: 'sp_3', name: 'Arjun K.', avatar: '⚡', isSpeaking: false, isMuted: true, role: 'Speaker' },
      { id: 'sp_4', name: 'Aakash V.', avatar: '🦁', isSpeaking: true, isMuted: false, role: 'Speaker' },
      { id: 'sp_5', name: 'Kavya M.', avatar: '🌷', isSpeaking: false, isMuted: false, role: 'Speaker' },
      { id: 'sp_6', name: 'Rohan S.', avatar: '🎮', isSpeaking: false, isMuted: true, role: 'Speaker' },
      { id: 'sp_7', name: 'Zoya K.', avatar: '💫', isSpeaking: false, isMuted: false, role: 'Speaker' },
      { id: 'sp_8', name: 'Vikram J.', avatar: '🚀', isSpeaking: false, isMuted: true, role: 'Speaker' }
    ],
    preparedMessages: [
      'Welcome everyone to Chai Corner! Who had adrak chai today? ☕',
      'Haha yes! Ginger chai in this weather is unmatched! 🌧️',
      'Hey everyone, I just joined from Bengaluru! Great to be here.',
      'Sending love from Mumbai! 💖',
      'Raise your hands if you want to speak on mic, Priya is granting requests! ✋',
      'Whoever is playing that background music, so calming! 🎶'
    ]
  },
  {
    id: 'room_2',
    title: '🎵 Midnight Music & Lofi Lounge',
    topic: 'Song recommendations, jamming, acoustic vocals, and sharing favorite playlists.',
    category: 'Music',
    badge: 'Live Jam',
    emoji: '🎧',
    bannerGradient: 'from-violet-600 via-purple-600 to-indigo-700',
    language: 'English & Multi',
    listenersCount: 215,
    speakers: [
      { id: 'sp_20', name: 'Rahul M.', avatar: '🎧', isSpeaking: true, isMuted: false, isHost: true, role: 'DJ / Host' },
      { id: 'sp_21', name: 'Meera I.', avatar: '🎨', isSpeaking: false, isMuted: false, isHost: false, role: 'Vocalist' },
      { id: 'sp_22', name: 'Karthik R.', avatar: '🎸', isSpeaking: true, isMuted: false, role: 'Guitarist' },
      { id: 'sp_23', name: 'Kabir B.', avatar: '🎷', isSpeaking: false, isMuted: false, role: 'Saxophone' },
      { id: 'sp_24', name: 'Tanya S.', avatar: '🪕', isSpeaking: false, isMuted: true, role: 'Speaker' },
      { id: 'sp_25', name: 'Dev R.', avatar: '🥁', isSpeaking: false, isMuted: false, role: 'Speaker' },
      { id: 'sp_26', name: 'Alia P.', avatar: '🎤', isSpeaking: false, isMuted: true, role: 'Speaker' },
      { id: 'sp_27', name: 'Sam W.', avatar: '🎹', isSpeaking: false, isMuted: true, role: 'Speaker' }
    ],
    preparedMessages: [
      'That guitar chord progression was so soothing @Karthik! 🎸✨',
      'Next song: can someone play Kesariya or Ilaiyaraaja classics? 🎵',
      'Sending a guitar gift! 🎁',
      'Drop your Spotify playlist links in the chat guys!',
      'Vocal harmonization was goosebumps! 🔥👏'
    ]
  },
  {
    id: 'room_3',
    title: '🎬 Cinema & Series Addicts',
    topic: 'Reviewing recent movie releases, mind-bending plot twists, and series recommendations.',
    category: 'Movies',
    badge: 'Trending',
    emoji: '🍿',
    bannerGradient: 'from-rose-600 via-red-500 to-amber-600',
    language: 'English & Hindi',
    listenersCount: 92,
    speakers: [
      { id: 'sp_30', name: 'Vikram J.', avatar: '🚀', isSpeaking: false, isMuted: false, isHost: true, role: 'Host' },
      { id: 'sp_31', name: 'Arjun K.', avatar: '⚡', isSpeaking: true, isMuted: false, isHost: false, role: 'Co-Host' },
      { id: 'sp_32', name: 'Kavita L.', avatar: '📽️', isSpeaking: false, isMuted: false, role: 'Reviewer' },
      { id: 'sp_33', name: 'Aditya C.', avatar: '🎞️', isSpeaking: true, isMuted: false, role: 'Speaker' },
      { id: 'sp_34', name: 'Shreya T.', avatar: '✨', isSpeaking: false, isMuted: true, role: 'Speaker' },
      { id: 'sp_35', name: 'Nikhil P.', avatar: '🕶️', isSpeaking: false, isMuted: false, role: 'Speaker' },
      { id: 'sp_36', name: 'Maya D.', avatar: '🎭', isSpeaking: false, isMuted: true, role: 'Speaker' },
      { id: 'sp_37', name: 'Harsh V.', avatar: '🎟️', isSpeaking: false, isMuted: true, role: 'Speaker' }
    ],
    preparedMessages: [
      'No spoilers for the climax please! 🙈',
      'The cinematography in that movie was out of this world 🌌',
      'Who here watched Interstellar more than 5 times? ✋',
      'Any recommendations for thriller web series on Netflix?'
    ]
  },
  {
    id: 'room_4',
    title: '📚 Silent Study & Work Pod',
    topic: 'Pomodoro timer running. Quiet productive space. Mic muted, chill ambient lo-fi.',
    category: 'Study',
    badge: 'Focus',
    emoji: '📖',
    bannerGradient: 'from-emerald-600 via-teal-600 to-cyan-700',
    language: 'Quiet Space',
    listenersCount: 84,
    speakers: [
      { id: 'sp_40', name: 'Study Bot ⏱️', avatar: '⏳', isSpeaking: false, isMuted: true, isHost: true, role: 'Timer' },
      { id: 'sp_41', name: 'Ananya R.', avatar: '🦋', isSpeaking: false, isMuted: true, isHost: false, role: 'Mod' },
      { id: 'sp_42', name: 'Farhan K.', avatar: '💻', isSpeaking: false, isMuted: true, role: 'Coder' },
      { id: 'sp_43', name: 'Rhea B.', avatar: '📝', isSpeaking: false, isMuted: true, role: 'Study' },
      { id: 'sp_44', name: 'Tanvi S.', avatar: '🔬', isSpeaking: false, isMuted: true, role: 'Study' },
      { id: 'sp_45', name: 'Pranav M.', avatar: '📐', isSpeaking: false, isMuted: true, role: 'Study' },
      { id: 'sp_46', name: 'Gayatri D.', avatar: '📖', isSpeaking: false, isMuted: true, role: 'Study' },
      { id: 'sp_47', name: 'Ishan N.', avatar: '☕', isSpeaking: false, isMuted: true, role: 'Study' }
    ],
    preparedMessages: [
      'Pomodoro round 3 starting now! 25 minutes of deep focus 🎯',
      'Let us finish our tasks today team! 💪',
      'Remember to drink water everyone 💧'
    ]
  },
  {
    id: 'room_5',
    title: '🌴 Tamil Talks & Vibes (தமிழ் அரட்டை)',
    topic: 'சென்னையில் இருந்து உலகம் வரை உள்ள நண்பர்கள் கூடும் அரட்டை களம். வாங்க பழகலாம்!',
    category: 'Tamil Talks',
    badge: 'Regional',
    emoji: '🌴',
    bannerGradient: 'from-amber-600 via-yellow-600 to-orange-600',
    language: 'தமிழ் (Tamil)',
    listenersCount: 162,
    speakers: [
      { id: 'sp_50', name: 'Karthik R.', avatar: '🎸', isSpeaking: true, isMuted: false, isHost: true, role: 'Host' },
      { id: 'sp_51', name: 'Deepa K.', avatar: '🌻', isSpeaking: false, isMuted: false, isHost: false, role: 'Co-Host' },
      { id: 'sp_52', name: 'Meera I.', avatar: '🎨', isSpeaking: true, isMuted: false, role: 'Speaker' },
      { id: 'sp_53', name: 'Saravanan M.', avatar: '☕', isSpeaking: false, isMuted: false, role: 'Speaker' },
      { id: 'sp_54', name: 'Bhavani S.', avatar: '🌺', isSpeaking: false, isMuted: true, role: 'Speaker' },
      { id: 'sp_55', name: 'Vijay V.', avatar: '🦁', isSpeaking: false, isMuted: true, role: 'Speaker' },
      { id: 'sp_56', name: 'Anitha R.', avatar: '✨', isSpeaking: false, isMuted: false, role: 'Speaker' },
      { id: 'sp_57', name: 'Dinesh K.', avatar: '🕶️', isSpeaking: false, isMuted: true, role: 'Speaker' }
    ],
    preparedMessages: [
      'வணக்கம் நண்பர்களே! எல்லாரும் சாப்டாச்சா? 🍛',
      'இன்னைக்கு மழைக்கு சூடா பஜ்ஜியும் டீயும் செம காம்போ! ☕',
      'அனிருத் புது பாட்டு எப்டி இருக்கு சொல்லுங்க? 🎵',
      'வாங்க பேசலாம், கை தூக்குங்க மைக் தர்றோம்! ✋'
    ]
  },
  {
    id: 'room_6',
    title: '🌙 Late Night Confessions & Deep Talks',
    topic: 'Quiet hours, honest confessions, life advice, and sharing stories before sleep.',
    category: 'Late Night',
    badge: 'Night Owls',
    emoji: '🌌',
    bannerGradient: 'from-slate-800 via-indigo-950 to-purple-950',
    language: 'English & Hindi',
    listenersCount: 195,
    speakers: [
      { id: 'sp_60', name: 'Sneha N.', avatar: '🌈', isSpeaking: true, isMuted: false, isHost: true, role: 'Host' },
      { id: 'sp_61', name: 'Aakash V.', avatar: '🦁', isSpeaking: false, isMuted: false, isHost: false, role: 'Co-Host' },
      { id: 'sp_62', name: 'Priya S.', avatar: '🌸', isSpeaking: false, isMuted: false, role: 'Speaker' },
      { id: 'sp_63', name: 'Divya R.', avatar: '✨', isSpeaking: true, isMuted: false, role: 'Speaker' },
      { id: 'sp_64', name: 'Kabir L.', avatar: '🕯️', isSpeaking: false, isMuted: true, role: 'Speaker' },
      { id: 'sp_65', name: 'Tara M.', avatar: '🌙', isSpeaking: false, isMuted: false, role: 'Speaker' },
      { id: 'sp_66', name: 'Neil P.', avatar: '🪐', isSpeaking: false, isMuted: true, role: 'Speaker' },
      { id: 'sp_67', name: 'Simran D.', avatar: '💫', isSpeaking: false, isMuted: true, role: 'Speaker' }
    ],
    preparedMessages: [
      'Sometimes late night talks heal things we never knew were hurting 💭',
      'So glad I found this room tonight, feeling very peaceful ❤️',
      'What was the one decision that completely changed your life?',
      'Sleep well friends when you head to bed 🌙✨'
    ]
  }
];

export const INITIAL_GIFTS: GiftItem[] = [
  { id: 'gift_1', name: 'Sweet Rose', emoji: '🌹', cost: 10, tag: 'Romantic' },
  { id: 'gift_2', name: 'Dark Chocolate', emoji: '🍫', cost: 25, tag: 'Sweet' },
  { id: 'gift_3', name: 'Kullad Chai', emoji: '☕', cost: 50, tag: 'Cozy' },
  { id: 'gift_4', name: 'Fluffy Teddy', emoji: '🧸', cost: 100, tag: 'Cuddly' },
  { id: 'gift_5', name: 'Royal Crown', emoji: '👑', cost: 250, tag: 'VIP' },
  { id: 'gift_6', name: 'Rocket Boost', emoji: '🚀', cost: 500, tag: 'Super' },
  { id: 'gift_7', name: 'Nest Diamond', emoji: '💎', cost: 1000, tag: 'Prestige' },
  { id: 'gift_8', name: 'Magical Unicorn', emoji: '🦄', cost: 1500, tag: 'Legendary' }
];

export const INITIAL_FRIEND_REQUESTS: FriendRequest[] = [
  {
    id: 'req_1',
    user: INITIAL_USERS[4], // Deepa Krishnan
    mutualCount: 3,
    timestamp: Date.now() - 3600000 * 2
  },
  {
    id: 'req_2',
    user: INITIAL_USERS[8], // Divya Reddy
    mutualCount: 5,
    timestamp: Date.now() - 3600000 * 5
  }
];

export const INITIAL_CHATS: Record<string, ChatMessage[]> = {
  user_1: [
    {
      id: 'm1_1',
      senderId: 'user_1',
      receiverId: 'me',
      text: 'Hey Alex! Did you listen to that new acoustic track I mentioned?',
      timestamp: Date.now() - 3600000 * 4,
      isUser: false,
      isRead: true
    },
    {
      id: 'm1_2',
      senderId: 'me',
      receiverId: 'user_1',
      text: 'Yes! It was so relaxing, loved the guitar solos in the middle 🎶',
      timestamp: Date.now() - 3600000 * 3,
      isUser: true,
      isRead: true
    },
    {
      id: 'm1_3',
      senderId: 'user_1',
      receiverId: 'me',
      text: 'I knew you would like it! Are you joining the Chai Corner voice room tonight?',
      timestamp: Date.now() - 1800000,
      isUser: false,
      isRead: true
    }
  ],
  user_2: [
    {
      id: 'm2_1',
      senderId: 'user_2',
      receiverId: 'me',
      text: 'Machan! Let us do a quick voice call later if you are free 🎸',
      timestamp: Date.now() - 7200000,
      isUser: false,
      isRead: true
    },
    {
      id: 'm2_2',
      senderId: 'me',
      receiverId: 'user_2',
      text: 'Sure Karthik, let me know when you start jamming!',
      timestamp: Date.now() - 5400000,
      isUser: true,
      isRead: true
    }
  ]
};

export const FRIENDLY_AUTO_REPLIES: Record<string, string[]> = {
  user_1: [
    'That sounds really awesome! Tell me more about it 😊',
    'Haha true! I was just thinking the exact same thing.',
    'Aww that made my day! How is your evening going? ✨',
    'We should definitely talk about this in the voice room later ☕',
    'I agree 100%! You always have such great perspectives.'
  ],
  user_2: [
    'Super machan! That is really cool 🎸',
    'Haha totally! Next time we catch up on call we will discuss this.',
    'Nice one! Filter coffee cheers ☕',
    'Got it! Always good vibes chatting with you.',
    'Let us jam on this soon 🎶'
  ],
  default: [
    'Hey! That is so wonderful to hear 😊',
    'Thanks for sharing! How has your day been so far?',
    'Haha love that! ChatNest is such a fun place to chill ✨',
    'Totally! Sending you warm positive vibes 🌸',
    'Let us catch up in one of the voice rooms soon too!'
  ]
};

export const AVATAR_OPTIONS = [
  '🦊', '🐼', '🦁', '🐯', '🦄', '🐱', '🐶', '🐨', 
  '🌸', '🎸', '⚡', '🎧', '🌈', '🚀', '✨', '☕'
];
