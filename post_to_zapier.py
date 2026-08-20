import os, requests

with open("review.txt") as f:
    review = f.read()

requests.post(
    os.environ["ZAPIER_WEBHOOK_URL"],
    json={"text": f"*Deal Quality Review*\n\n{review}"}
)
