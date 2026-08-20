import os, re, requests

with open("review.txt") as f:
    review = f.read()

# Convert Markdown headers (##, ###) into Slack bold
review = re.sub(r'^#{1,6}\s*(.+)$', r'*\1*', review, flags=re.MULTILINE)

# Convert **bold** into Slack's *bold*
review = re.sub(r'\*\*(.+?)\*\*', r'*\1*', review)

requests.post(
    os.environ["ZAPIER_WEBHOOK_URL"],
    json={"text": f"*Deal Quality Review*\n\n{review}"}
)
