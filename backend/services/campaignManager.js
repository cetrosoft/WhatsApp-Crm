class CampaignManager {
  constructor() {
    this.activeCampaigns = new Map();
    this.campaignCounter = 0;
  }

  startCampaign(campaignData) {
    const campaignId = ++this.campaignCounter;
    const campaign = {
      id: campaignId,
      status: 'running',
      data: campaignData,
      currentIndex: 0,
      results: [],
      createdAt: new Date(),
      pausedAt: null
    };

    this.activeCampaigns.set(campaignId, campaign);
    console.log(`🚀 Campaign ${campaignId} started. Active campaigns:`, Array.from(this.activeCampaigns.keys()));
    return campaignId;
  }

  pauseCampaign(campaignId) {
    console.log(`🔍 Attempting to pause campaign ${campaignId}`);
    console.log(`📊 Active campaigns:`, Array.from(this.activeCampaigns.keys()));
    const campaign = this.activeCampaigns.get(campaignId);
    if (campaign && campaign.status === 'running') {
      campaign.status = 'paused';
      campaign.pausedAt = new Date();
      console.log(`✅ Campaign ${campaignId} paused successfully`);
      return true;
    }
    console.log(`❌ Failed to pause campaign ${campaignId}. Campaign found: ${!!campaign}, Status: ${campaign?.status}`);
    return false;
  }

  resumeCampaign(campaignId) {
    const campaign = this.activeCampaigns.get(campaignId);
    if (campaign && campaign.status === 'paused') {
      campaign.status = 'running';
      campaign.pausedAt = null;
      return true;
    }
    return false;
  }

  stopCampaign(campaignId) {
    console.log(`🔍 Attempting to stop campaign ${campaignId}`);
    console.log(`📊 Active campaigns:`, Array.from(this.activeCampaigns.keys()));
    const campaign = this.activeCampaigns.get(campaignId);
    if (campaign) {
      campaign.status = 'stopped';
      this.activeCampaigns.delete(campaignId);
      console.log(`✅ Campaign ${campaignId} stopped successfully`);
      return true;
    }
    console.log(`❌ Campaign ${campaignId} not found for stopping`);
    return false;
  }

  getCampaign(campaignId) {
    return this.activeCampaigns.get(campaignId);
  }

  updateCampaignProgress(campaignId, currentIndex, result) {
    const campaign = this.activeCampaigns.get(campaignId);
    if (campaign) {
      campaign.currentIndex = currentIndex;
      if (result) {
        campaign.results.push(result);
      }
    }
  }

  completeCampaign(campaignId) {
    const campaign = this.activeCampaigns.get(campaignId);
    if (campaign) {
      campaign.status = 'completed';
      campaign.completedAt = new Date();
      // Keep completed campaigns for a while
      setTimeout(() => {
        this.activeCampaigns.delete(campaignId);
      }, 300000); // Remove after 5 minutes
    }
  }

  getActiveCampaigns() {
    return Array.from(this.activeCampaigns.values());
  }
}

const campaignManager = new CampaignManager();
export default campaignManager;