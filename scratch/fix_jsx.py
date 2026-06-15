import re

filepath = r"c:\Users\user\OneDrive\Desktop\StartupLens\frontend\src\components\LandingPage.tsx"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Let's find agentLogs[agentStep]
idx = content.find("agentLogs[agentStep]")
if idx == -1:
    print("Could not find agentLogs[agentStep]")
    exit(1)

# Let's search for the next closing tags starting from idx
# We expect to see:
# {agentLogs[agentStep]}
# </div>
# 
# </div>
# </div>
# </div>
# </div>
# </div>
# </section>

sub = content[idx:idx+500]
print("Found context:")
print(sub.encode('ascii', 'replace').decode('ascii'))

# Let's construct a regex that replaces the closing tags
# We want to replace:
# {agentLogs[agentStep]}
#                                 </div>
# 
#                                 </div>
#                             </div>
#                         </div>
#                     </div>
#                 </div>
#             </section>
# to:
# {agentLogs[agentStep]}
#                                 </div>
# 
#                             </div>
#                         </div>
#                     </div>
#                 </div>
#             </section>

# Let's do a replace using regex that allows variable whitespace:
pattern = r"agentLogs\[agentStep\]\}\s*</div>\s*</div>\s*</div>\s*</div>\s*</div>\s*</div>\s*</section>"
# Wait, let's look at the actual tags:
# Inside aspect-video (div 4):
# <div className="bg-[#F0F0F0] p-2.5 border border-[#C0C0C0] rounded-md text-[#111827] font-mono text-[11px] relative z-10 transition-all duration-300">
#     <span className="text-[#4B5563] font-bold">$ </span>
#     {agentLogs[agentStep]}
# </div>  <-- Closes ticker div
# 
# </div> <-- Closes aspect-video
# </div> <-- Closes border
# </div> <-- Closes w-full
# </div> <-- Closes max-w-[1320px]
# </div> <-- Closes section ? No, section id="home" is not a div, it's </section>.
# So we have:
# ticker div (closed)
# aspect-video (closed)
# border (closed)
# w-full (closed)
# max-w-[1320px] (closed)
# So we need four </div> after the ticker div, followed by </section>.
# Currently in the file we have:
# </div> (ticker)
# </div> (aspect-video)
# </div> (border)
# </div> (w-full)
# </div> (max-w-[1320px])
# </div> (extra)
# </section>

pattern = r"(agentLogs\[agentStep\]\}\s*</div>\s*\n\s*)</div>\s*\n\s*</div>\s*\n\s*</div>\s*\n\s*</div>\s*\n\s*</div>\s*\n\s*</section>"
replacement = r"\1</div>\n                            </div>\n                        </div>\n                    </div>\n            </section>"

new_content, count = re.subn(pattern, replacement, content)
print(f"Replaced {count} occurrences")

if count > 0:
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Success")
else:
    # Let's inspect the exact lines
    lines = content.splitlines()
    for i in range(370, 390):
        if i < len(lines):
            print(f"{i}: {repr(lines[i])}")
