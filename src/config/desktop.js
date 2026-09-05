export const apps = [
  {
    icon: 'applications-multimedia',
    label: 'WGV Media Player',
    appletUrl: '/applet/media-player',
    windowSetting: {
      minWidth: 640,
      minHeight: 400,
    },
  },
  {
    icon: 'applications-photography',
    label: 'Photo Viewer',
    appletUrl: '/applet/photo-album',
    windowSetting: {
      minWidth: 640,
      minHeight: 480,
    },
  },
  // {
  //   icon: 'susers',
  //   label: 'Video Call',
  //   appletUrl: '/applet/video-call',
  //   windowSetting: {
  //     minWidth: 800,
  //     minHeight: 600,
  //   },
  // },
  // {
  //   icon: 'telephone',
  //   label: 'Voicemail',
  //   appletUrl: '/applet/voice-mail',
  //   windowSetting: {
  //     minWidth: 500,
  //     minHeight: 480,
  //   },
  // },
  {
    icon: 'mailnag',
    label: 'E-Mail',
    appletUrl: '/applet/email',
    windowSetting: {
      minWidth: 500,
      minHeight: 480,
    },
  },
]

export const desktopIcons = [
  ...apps,
  // {
  //   icon: 'audiobook',
  //   label: 'TONOfMemories.pdf',
  //   appletUrl: 'https://online.fliphtml5.com/cxnyj/ocnr/',
  //   windowSetting: {
  //     minWidth: 500,
  //     minHeight: 480,
  //   },
  // },
]
