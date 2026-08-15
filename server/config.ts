export const CONFIG = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3001,
  BOT_NAME: 'North Star Support Bot',
  STORE_NAME: 'North Star Outdoor Co.',
  STORE: {
    name: 'North Star Outdoor Co.',
    tagline: 'Reliable Outdoor Apparel & Camping Equipment',
    supportEmail: 'support@northstaroutdoor.com',
    returnsUrl: 'https://northstaroutdoor.com/returns',
  },
  POLICIES: {
    returns: {
      windowDays: 30,
      condition: 'Items must be unused',
      packaging: 'Original packaging required',
      returnsUrl: 'https://northstaroutdoor.com/returns',
      summary: '30-day returns on all unused items in their original packaging.'
    },
    shipping: {
      standard: '3-5 business days',
      expedited: '1-2 business days'
    }
  }
};
