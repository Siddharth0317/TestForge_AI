from typing import Optional, List, Dict, Any
import json

PROMPT_TEMPLATE_VERSION = "1.0.0"

SYSTEM_PROMPT_V1 = """You are TestForge AI, an expert software test automation engineer.
Your task is to generate rigorous, verifiable candidate test cases for a given software requirement.

CRITICAL CONSTRAINTS:
1. You must output ONLY a valid JSON object matching the requested schema. No conversational prose, no markdown code block fences unless requested.
2. NEVER generate arbitrary Python, JavaScript, or shell code. All test steps MUST use the approved action vocabulary:
   - navigate: load a named target page (e.g. target_ref='login_page')
   - click: click an element (e.g. target_ref='submit_button')
   - enter_text: type text into an input field (e.g. target_ref='email_input', value_ref='test_user@example.com')
   - select_option: select an option from a dropdown
   - wait_for_visible: wait until an element is visible
   - assert_text: verify element contains expected text (e.g. target_ref='error_banner', value_ref='Invalid password')
   - assert_visible: verify element is visible on the screen
   - assert_url: verify current URL contains expected pattern
3. NEVER embed real production credentials, real API keys, or private sensitive data. Use clear test references (e.g. 'standard_test_user', 'invalid_pwd_123').
4. If you must assume any behavior that is NOT explicitly stated in the requirement (e.g. timeout duration, specific error message text, field max length), you MUST list each assumption in the 'assumptions' array.
5. In 'source_evidence', quote the exact substring from the requirement text that justifies this test case.
6. Generate distinct scenarios as requested (e.g., positive, negative, boundary, authorization, error_handling, state_transition).
"""


def build_user_prompt_v1(
    requirement_text: str,
    requirement_id: str,
    requirement_version: int = 1,
    category: Optional[str] = None,
    scenario_types: Optional[List[str]] = None,
    nlp_analysis: Optional[Dict[str, Any]] = None,
    max_cases: int = 3
) -> str:
    """Constructs the user generation prompt with requirement context and NLP hints."""
    scenarios_str = ", ".join(scenario_types) if scenario_types else "positive, negative, boundary"
    
    context_lines = [
        f"REQUIREMENT ID: {requirement_id}",
        f"REQUIREMENT VERSION: {requirement_version}",
        f"REQUIREMENT TEXT: \"{requirement_text}\"",
    ]
    
    if category:
        context_lines.append(f"PREDICTED CATEGORY: {category}")
        
    if nlp_analysis:
        actors = nlp_analysis.get("actors", [])
        actions = nlp_analysis.get("actions", [])
        entities = nlp_analysis.get("entities", [])
        conditions = nlp_analysis.get("conditions", [])
        constraints = nlp_analysis.get("constraints", [])
        outcomes = nlp_analysis.get("outcomes", [])
        
        nlp_hints = []
        if actors:
            nlp_hints.append(f"- Extracted Actors: {', '.join(actors)}")
        if actions:
            nlp_hints.append(f"- Extracted Actions: {', '.join(actions)}")
        if entities:
            nlp_hints.append(f"- Extracted Entities: {', '.join(entities)}")
        if conditions:
            nlp_hints.append(f"- Extracted Conditions: {', '.join(conditions)}")
        if constraints:
            nlp_hints.append(f"- Extracted Constraints: {', '.join(constraints)}")
        if outcomes:
            nlp_hints.append(f"- Extracted Outcomes: {', '.join(outcomes)}")
            
        if nlp_hints:
            context_lines.append("EXTRACTED LINGUISTIC CONTEXT:")
            context_lines.extend(nlp_hints)

    context_lines.append(f"\nREQUESTED SCENARIO TYPES: {scenarios_str}")
    context_lines.append(f"MAX CANDIDATES TO GENERATE: {max_cases}")
    context_lines.append("""
OUTPUT FORMAT:
Generate a JSON object with a single key "candidates" containing an array of candidate test cases.
Each candidate object must adhere to this exact structure:
{
  "candidates": [
    {
      "schema_version": "1.0",
      "requirement_id": "<requirement_id>",
      "requirement_version": <requirement_version>,
      "title": "<Descriptive test title>",
      "category": "<authentication|validation|business_logic|security|error_handling|data_integrity>",
      "scenario_type": "<positive|negative|boundary|authorization|error_handling|state_transition>",
      "preconditions": ["<Prerequisite condition>"],
      "test_data": {"<param_name>": "<param_value>"},
      "steps": [
        {
          "step_number": 1,
          "action": "<navigate|click|enter_text|select_option|wait_for_visible|assert_text|assert_visible|assert_url>",
          "target_ref": "<named_locator>",
          "value_ref": "<optional_value_or_null>"
        }
      ],
      "expected_result": "<Clear verifiable result>",
      "priority": "<critical|high|medium|low>",
      "automation_status": "requires_configuration",
      "assumptions": ["<Any unstated assumption>"],
      "source_evidence": [
        {
          "requirement_span": "<Exact phrase from requirement text>"
        }
      ],
      "review_status": "pending"
    }
  ]
}
""")
    return "\n".join(context_lines)

