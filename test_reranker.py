from sentence_transformers import CrossEncoder
import math

model = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")

query = "retail fashion platform for dresses"
doc = "99dresses was a startup in the Retail Trade sector. It operated for 2010 - 2013. The company worked on: An online fashion platform allowing users to trade dresses and fashion items. They raised or burned approximately $1.2M raised. Ultimately, the company failed and shut down because High customer acquisition costs, low retention, and failure of a crucial funding round. A key learning from their failure is: Balance growth with unit economics and secure backup funding."

score = model.predict([query, doc])
sigmoid_score = 1.0 / (1.0 + math.exp(-score))

print(f"Query: '{query}'")
print(f"Doc: '{doc}'")
print(f"Raw Score: {score}")
print(f"Sigmoid Score: {sigmoid_score}")
