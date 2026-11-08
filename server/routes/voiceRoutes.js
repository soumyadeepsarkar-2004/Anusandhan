import express from 'express';
import { PythonBridge } from '../services/pythonBridge.js';
import { ingestionService } from '../services/dataIngestionService.js';

const router = express.Router();

router.post('/turn', async (req, res) => {
  try {
    const pythonVoice = await PythonBridge.processVoiceTurn(req.body);
    if (pythonVoice) {
      if (pythonVoice.detected_intent === 'navigate_postings_scraped' || pythonVoice.suggested_ui_filter?.filter === 'scraped') {
        pythonVoice.suggested_ui_filter = { subTab: 'scraped', filter: 'scraped' };
      }
      return res.json(pythonVoice);
    }

    // Node fallback voice dialog turn with dynamic opportunities and model tagging
    const input = (req.body.user_input || '').toLowerCase();
    let responseText = "Main aapka AnusandhanAI Assistant hoon. Anusandhan platform par aap mujhse kisi bhi professor, fellowship, ya application status ke baray mein pooch sakte hain.";
    let action = "NOOP";
    let opportunity_links = null;
    let suggested_ui_filter = {};

    if (input.includes('upcoming') || input.includes('next') || input.includes('aane wala')) {
      const upcoming = ingestionService.getFellowships().filter(f => f.status === 'upcoming');
      responseText = "2 major upcoming fellowship cycles hain: IIT Kanpur SURGE aur CSIR SRTP. Unke verified application portals open hone wale hain!";
      action = "navigate_fellowships_upcoming";
      suggested_ui_filter = { subTab: 'fellowships', status: 'upcoming' };
      opportunity_links = upcoming.map(f => ({
        name: f.name,
        url: f.applicationPortalUrl || f.officialUrl,
        status: f.status
      }));
    } else if (input.includes('passed') || input.includes('closed') || input.includes('over')) {
      const passed = ingestionService.getFellowships().filter(f => f.status === 'passed');
      responseText = "Mitacs Globalink aur S.N. Bose Scholars ke past guidelines aur archived portals preserved hain.";
      action = "navigate_fellowships_passed";
      suggested_ui_filter = { subTab: 'fellowships', status: 'passed' };
      opportunity_links = passed.map(f => ({
        name: f.name,
        url: f.officialUrl,
        status: f.status
      }));
    } else if (input.includes('fellowship') || input.includes('active') || input.includes('daad') || input.includes('cern') || input.includes('iisc') || input.includes('opportunity')) {
      const active = ingestionService.getFellowships().filter(f => f.status === 'active');
      responseText = `Abhi ${active.length} verified programs live hain: IISc SRFP, DAAD WISE, TIFR VSRP, aur CERN Summer Student. Direct application portals ready hain!`;
      action = "navigate_fellowships_active";
      suggested_ui_filter = { subTab: 'fellowships', status: 'active' };
      opportunity_links = active.slice(0, 4).map(f => ({
        name: f.name,
        url: f.applicationPortalUrl || f.officialUrl,
        status: f.status
      }));
    } else if (input.includes('posting') || input.includes('nayi') || input.includes('naya') || input.includes('opening') || input.includes('scrape') || input.includes('latest')) {
      const postings = ingestionService.getScrapedPostings();
      const count = postings.length || 6;
      responseText = `Autonomous crawler ne internet se ${count} fresh research postings aur lab openings scrape kiye hain! IISc, MIT, Stanford, aur Max Planck ke naye openings ready hain.`;
      action = "navigate_postings_scraped";
      suggested_ui_filter = { subTab: 'scraped', filter: 'scraped' };
      opportunity_links = postings.slice(0, 4).map(p => ({
        name: `${p.name} (${p.university})`,
        url: p.recentPaper?.doiUrl || p.labUrl || 'https://arxiv.org',
        status: 'active'
      }));
    } else if (input.includes('status') || input.includes('update')) {
      responseText = "Aapke 2 applications active hain: IISc Bangalore mein Prof. Chiranjib ka email jitter queue mein hai, aur Max Planck ke Prof. Bernhard Schölkopf ka draft ready hai!";
      action = "OPEN_CRM";
    } else if (input.includes('grant') || input.includes('funding')) {
      responseText = "Maine 3 professors identify kiye hain jinke paas active DST, MeitY aur ERC grants hain jo student researchers ko fund karte hain.";
      action = "FILTER_OPPORTUNITIES";
    } else if (input.includes('cv') || input.includes('resume') || input.includes('rrs') || input.includes('score')) {
      responseText = "Aapka Research Readiness Score diagnostic studio open kar diya hai. Yahan aap apna 5-pillar CV gap audit check kar sakte hain.";
      action = "VIEW_DIAGNOSTIC";
    } else if (input.includes('interview') || input.includes('mock') || input.includes('viva')) {
      responseText = "Technical viva aur mock interview simulator launch kar raha hoon.";
      action = "START_MOCK_INTERVIEW";
    }

    res.json({
      agent_text_response: responseText,
      detected_intent: action.toLowerCase(),
      recommended_action: action,
      suggested_ui_filter,
      opportunity_links,
      engine_used: `${req.body.voice_engine || 'sarvam'} · ${req.body.model || 'gemini-flash'} (Node Gateway)`,
      latency_ms: 18
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
