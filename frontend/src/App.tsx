// src/App.tsx
import { useEffect, useState } from "react";

interface SurveyRow {
  id: number;
  question: "Demographic" | "Health" | "Financial" | string;
  description: string;
  answer: string; // JSON blob
}

type SurveyMeta = {
  fullName: string;
  age: string;
  title: string;
  description: string;
};

type Demographic = {
  gender: "Female" | "Male" | "Non-binary" | "Prefer not to say" | "";
  maritalStatus: "Single" | "Married" | "Divorced" | "Widowed" | "Prefer not to say" | "";
  dependents: string;
};

type Health = {
  conditions: string[];
  conditionsOther: string;
  medications: string[];
  medicationsOther: string;
  mobilityAssistance: "Yes" | "No" | "Sometimes" | "";
};

type Financial = {
  incomeRange:
    | "<25k"
    | "25k-50k"
    | "50k-75k"
    | "75k-100k"
    | "100k-150k"
    | "150k-200k"
    | ">200k"
    | "";
  insuranceProvider:
    | "Aetna"
    | "Blue Cross Blue Shield"
    | "Cigna"
    | "Kaiser"
    | "Medicare"
    | "Medicaid"
    | "UnitedHealthcare"
    | "Other"
    | "None"
    | "";
  insuranceOther: string;
  coverageType:
    | "HMO"
    | "PPO"
    | "EPO"
    | "POS"
    | "High Deductible (HSA)"
    | "Medicare Advantage"
    | "None/Unknown"
    | "";
};

const API_URL = "http://localhost:4000";

// UI helpers
const card = "border rounded-2xl p-4 shadow-sm bg-white";
const label = "text-sm font-medium";
const input = "border px-3 py-2 rounded w-full";
const radio = "mr-2";
const chip = "inline-flex items-center gap-2 px-2 py-1 rounded-full border text-sm";

export default function App() {
  // auth
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState(localStorage.getItem("token") || "");

  // data
  const [rows, setRows] = useState<SurveyRow[]>([]);

  // meta (full name, age, title, description)
  const [meta, setMeta] = useState<SurveyMeta>({
    fullName: "",
    age: "",
    title: "",
    description: "",
  });

  // form states
  const [demographic, setDemographic] = useState<Demographic>({
    gender: "",
    maritalStatus: "",
    dependents: "",
  });

  const [health, setHealth] = useState<Health>({
    conditions: [],
    conditionsOther: "",
    medications: [],
    medicationsOther: "",
    mobilityAssistance: "",
  });

  const [financial, setFinancial] = useState<Financial>({
    incomeRange: "",
    insuranceProvider: "",
    insuranceOther: "",
    coverageType: "",
  });

  // AUTH
  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (data.token) {
      localStorage.setItem("token", data.token);
      setToken(data.token);
    } else {
      alert(data.error || "Login failed");
    }
  };

  const signup = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`${API_URL}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (data.token) {
      localStorage.setItem("token", data.token);
      setToken(data.token);
    } else {
      alert(data.error || "Signup failed");
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken("");
    setRows([]);
  };

  // LOAD
  const load = async () => {
    if (!token) return;
    const res = await fetch(`${API_URL}/survey`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setRows(data);
  };

  useEffect(() => {
    if (token) load();
  }, [token]);

  // SUBMIT (save everything in a single row)
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    const submission = {
      meta: { fullName: meta.fullName, age: meta.age },
      demographic,
      health,
      financial,
    };

    const res = await fetch(`${API_URL}/survey`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        question: meta.title || "Untitled Question",
        description: meta.description || "",
        answer: JSON.stringify(submission),
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err.error || "Failed to submit survey");
      return;
    }

    // clear form if you want
    // setMeta({fullName:'',age:'',title:'',description:''});
    // setDemographic({gender:'',maritalStatus:'',dependents:''});
    // setHealth({conditions:[],conditionsOther:'',medications:[],medicationsOther:'',mobilityAssistance:''});
    // setFinancial({incomeRange:'',insuranceProvider:'',insuranceOther:'',coverageType:''});

    load();
  };

  // helpers
  const toggleArrayValue = (arr: string[], v: string) =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  // UNAUTH VIEW
  if (!token) {
    return (
      <div className="p-6 max-w-md mx-auto space-y-4">
        <h1 className="text-2xl font-bold">Survey App</h1>
        <form onSubmit={login} className={`${card} space-y-2`}>
          <div className="text-lg font-semibold">Login</div>
          <input
            className={input}
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className={input}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button className="bg-blue-600 text-white px-4 py-2 rounded w-full">Login</button>
        </form>

        <button
          onClick={signup}
          className="bg-green-600 text-white px-4 py-2 rounded w-full"
        >
          Signup (New User? Create an Account)
        </button>
      </div>
    );
  }

  // AUTH VIEW
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Survey App</h1>
        <button className="bg-blue-600 text-white px-6 py-2 rounded" onClick={logout}>
          Logout
        </button>
      </div>

      {/* FORM */}
      <form onSubmit={submit} className="grid md:grid-cols-3 gap-4">
        {/* QUESTION DETAILS */}
        <div className={card}>
          <div className="text-lg font-semibold mb-2">Question Details</div>
          <div className="space-y-2">
            <div>
              <div className={label}>Full name</div>
              <input
                className={input}
                value={meta.fullName}
                onChange={(e) => setMeta({ ...meta, fullName: e.target.value })}
                required
              />
            </div>

            <div>
              <div className={label}>Age</div>
              <input
                className={input}
                type="number"
                min="0"
                value={meta.age}
                onChange={(e) => setMeta({ ...meta, age: e.target.value })}
                required
              />
            </div>

            <div>
              <div className={label}>Question title</div>
              <input
                className={input}
                placeholder="e.g., Waterlily Intake – Initial Submission"
                value={meta.title}
                onChange={(e) => setMeta({ ...meta, title: e.target.value })}
                required
              />
            </div>

            <div>
              <div className={label}>Question description</div>
              <textarea
                className={`${input} h-24`}
                placeholder="Short description (optional)"
                value={meta.description}
                onChange={(e) => setMeta({ ...meta, description: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* DEMOGRAPHIC */}
        <div className={card}>
          <div className="text-lg font-semibold mb-2">Demographic</div>
          <div className="space-y-2">
            <div>
              <div className={label}>Gender</div>
              <select
                className={input}
                value={demographic.gender}
                onChange={(e) =>
                  setDemographic({ ...demographic, gender: e.target.value as any })
                }
              >
                <option value="">Select…</option>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Non-binary">Non-binary</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>

            <div>
              <div className={label}>Marital status</div>
              <select
                className={input}
                value={demographic.maritalStatus}
                onChange={(e) =>
                  setDemographic({ ...demographic, maritalStatus: e.target.value as any })
                }
              >
                <option value="">Select…</option>
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Divorced">Divorced</option>
                <option value="Widowed">Widowed</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>

            <div>
              <div className={label}>Dependents</div>
              <input
                className={input}
                type="number"
                min="0"
                value={demographic.dependents}
                onChange={(e) => setDemographic({ ...demographic, dependents: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* HEALTH */}
        <div className={card}>
          <div className="text-lg font-semibold mb-2">Health</div>
          <div className="space-y-3">
            <div>
              <div className={label}>Conditions (check all that apply)</div>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {["Diabetes", "Hypertension", "Heart Disease", "COPD/Asthma", "Cancer", "Arthritis"].map(
                  (c) => (
                    <label key={c} className={chip}>
                      <input
                        type="checkbox"
                        className={radio}
                        checked={health.conditions.includes(c)}
                        onChange={() =>
                          setHealth({
                            ...health,
                            conditions: toggleArrayValue(health.conditions, c),
                          })
                        }
                      />
                      {c}
                    </label>
                  )
                )}
              </div>
              <input
                className={`${input} mt-2`}
                placeholder="Other conditions (comma-separated)"
                value={health.conditionsOther}
                onChange={(e) => setHealth({ ...health, conditionsOther: e.target.value })}
              />
            </div>

            <div>
              <div className={label}>Medications (check all that apply)</div>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {["Metformin", "Insulin", "Lisinopril", "Atorvastatin", "Albuterol", "Warfarin"].map(
                  (m) => (
                    <label key={m} className={chip}>
                      <input
                        type="checkbox"
                        className={radio}
                        checked={health.medications.includes(m)}
                        onChange={() =>
                          setHealth({
                            ...health,
                            medications: toggleArrayValue(health.medications, m),
                          })
                        }
                      />
                      {m}
                    </label>
                  )
                )}
              </div>
              <input
                className={`${input} mt-2`}
                placeholder="Other medications (comma-separated)"
                value={health.medicationsOther}
                onChange={(e) => setHealth({ ...health, medicationsOther: e.target.value })}
              />
            </div>

            <div>
              <div className={label}>Mobility assistance</div>
              <select
                className={input}
                value={health.mobilityAssistance}
                onChange={(e) =>
                  setHealth({ ...health, mobilityAssistance: e.target.value as any })
                }
              >
                <option value="">Select…</option>
                <option value="No">No</option>
                <option value="Yes">Yes</option>
                <option value="Sometimes">Sometimes</option>
              </select>
            </div>
          </div>
        </div>

        {/* FINANCIAL */}
        <div className={card}>
          <div className="text-lg font-semibold mb-2">Financial</div>
          <div className="space-y-3">
            <div>
              <div className={label}>Annual household income</div>
              <select
                className={input}
                value={financial.incomeRange}
                onChange={(e) =>
                  setFinancial({ ...financial, incomeRange: e.target.value as any })
                }
              >
                <option value="">Select…</option>
                <option value="<25k">&lt;25k</option>
                <option value="25k-50k">25k–50k</option>
                <option value="50k-75k">50k–75k</option>
                <option value="75k-100k">75k–100k</option>
                <option value="100k-150k">100k–150k</option>
                <option value="150k-200k">150k–200k</option>
                <option value=">200k">&gt;200k</option>
              </select>
            </div>

            <div>
              <div className={label}>Insurance provider</div>
              <select
                className={input}
                value={financial.insuranceProvider}
                onChange={(e) =>
                  setFinancial({ ...financial, insuranceProvider: e.target.value as any })
                }
              >
                <option value="">Select…</option>
                <option value="Aetna">Aetna</option>
                <option value="Blue Cross Blue Shield">Blue Cross Blue Shield</option>
                <option value="Cigna">Cigna</option>
                <option value="Kaiser">Kaiser</option>
                <option value="Medicare">Medicare</option>
                <option value="Medicaid">Medicaid</option>
                <option value="UnitedHealthcare">UnitedHealthcare</option>
                <option value="None">None</option>
                <option value="Other">Other</option>
              </select>

              {financial.insuranceProvider === "Other" && (
                <input
                  className={`${input} mt-2`}
                  placeholder="Enter provider"
                  value={financial.insuranceOther}
                  onChange={(e) =>
                    setFinancial({ ...financial, insuranceOther: e.target.value })
                  }
                />
              )}
            </div>

            <div>
              <div className={label}>Coverage type</div>
              <select
                className={input}
                value={financial.coverageType}
                onChange={(e) =>
                  setFinancial({ ...financial, coverageType: e.target.value as any })
                }
              >
                <option value="">Select…</option>
                <option value="HMO">HMO</option>
                <option value="PPO">PPO</option>
                <option value="EPO">EPO</option>
                <option value="POS">POS</option>
                <option value="High Deductible (HSA)">High Deductible (HSA)</option>
                <option value="Medicare Advantage">Medicare Advantage</option>
                <option value="None/Unknown">None/Unknown</option>
              </select>
            </div>
          </div>
        </div>

        <div className="md:col-span-3">
          <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded">
            Submit Intake
          </button>
        </div>
      </form>

      {/* REVIEW */}
      <div>
        <h2 className="text-xl font-semibold mb-2">Your Submitted Responses</h2>
        <div className="space-y-3">
          {rows.map((r) => {
            let parsed: any = null;
            try {
              parsed = JSON.parse(r.answer);
            } catch {}

            return (
              <div key={r.id} className={card}>

                {parsed ? (
                  <>
                    {/* Question Details */}
                    <div className="mb-3">
                      <div className="font-semibold">Question Details</div>
                      <ul className="text-sm space-y-1">
                        <li>Question Title: {r.question}</li>
                        <li>Question Description: {r.description}</li>
                        <li>Full name: {parsed.meta?.fullName || "—"}</li>
                        <li>Age: {parsed.meta?.age || "—"}</li>
                      </ul>
                    </div>

                    {/* Demographic */}
                    <div className="mb-3">
                      <div className="font-semibold">Demographic</div>
                      <ul className="text-sm space-y-1">
                        <li>Gender: {parsed.demographic?.gender || "—"}</li>
                        <li>Marital status: {parsed.demographic?.maritalStatus || "—"}</li>
                        <li>Dependents: {parsed.demographic?.dependents || "—"}</li>
                      </ul>
                    </div>

                    {/* Health */}
                    <div className="mb-3">
                      <div className="font-semibold">Health</div>
                      <ul className="text-sm space-y-1">
                        <li>
                          Conditions:{" "}
                          {[...(parsed.health?.conditions || []), parsed.health?.conditionsOther]
                            .filter(Boolean)
                            .join(", ") || "—"}
                        </li>
                        <li>
                          Medications:{" "}
                          {[...(parsed.health?.medications || []), parsed.health?.medicationsOther]
                            .filter(Boolean)
                            .join(", ") || "—"}
                        </li>
                        <li>Mobility assistance: {parsed.health?.mobilityAssistance || "—"}</li>
                      </ul>
                    </div>

                    {/* Financial */}
                    <div>
                      <div className="font-semibold">Financial</div>
                      <ul className="text-sm space-y-1">
                        <li>Income: {parsed.financial?.incomeRange || "—"}</li>
                        <li>
                          Insurance:{" "}
                          {parsed.financial?.insuranceProvider === "Other"
                            ? parsed.financial?.insuranceOther
                            : parsed.financial?.insuranceProvider || "—"}
                        </li>
                        <li>Coverage: {parsed.financial?.coverageType || "—"}</li>
                      </ul>
                    </div>
                  </>
                ) : (
                  <div>{r.answer}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
