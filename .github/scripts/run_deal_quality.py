import os, glob, json, requests
from anthropic import Anthropic

client = Anthropic()  # reads ANTHROPIC_API_KEY from env

skill_text = open(".claude/skills/deal-quality/SKILL.md").read()
deal_files = glob.glob("deals/*.md")
latest_deal = max(deal_files, key=os.path.getmtime)
deal_text = open(latest_deal).read()

response = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=1500,
    system=skill_text,
    messages=[{"role": "user", "content": f"Review this deal desk pricing document:\n\n{deal_text}"}]
)

review = response.content[0].text

# Send to Slack via Zapier webhook
requests.post(
    os.environ["ZAPIER_WEBHOOK_URL"],
    json={"text": f"*Deal Quality Review — {os.path.basename(latest_deal)}*\n\n{review}"}
)

print(review)
