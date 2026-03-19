import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { format, parseISO } from 'date-fns'
import Link from 'next/link'

export async function getServerSideProps({ params }) {
  const { data: course } = await supabase
    .from('courses')
    .select('*, regions(name)')
    .eq('id', params.id)
    .single()

  if (!course) return { notFound: true }

  const { count } = await supabase
    .from('registrations')
    .select('*', { count: 'exact', head: true })
    .eq('course_id', params.id)

  return { props: { course, registrationCount: count || 0 } }
}

const BLANK = {
  first_name: '', last_name: '', email: '', phone: '',
  dob_year: '', dob_month: '', dob_day: '',
  preferred_contact: '', special_considerations: '', heard_about_us: '',
  country: '', gender: '', ethnicity: [], income_sources: [],
  newcomer_to_canada: '', accommodation_type: '', household_composition: '',
  consent_given: false, privacy_policy_accepted: false,
}

export default function CoursePage({ course, registrationCount }) {
  const [step, setStep] = useState('info')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm] = useState(BLANK)

  const start = parseISO(course.start_time)
  const end = parseISO(course.end_time)
  const spotsLeft = course.max_participants ? course.max_participants - registrationCount : null
  const full = spotsLeft !== null && spotsLeft <= 0

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const toggle = (k, v) => setForm(f => ({
    ...f, [k]: f[k].includes(v) ? f[k].filter(x => x !== v) : [...f[k], v]
  }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.consent_given || !form.privacy_policy_accepted) {
      setError('You must consent to providing your information and accept the Privacy Policy to proceed.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const dob = form.dob_year && form.dob_month && form.dob_day
        ? `${form.dob_year}-${String(form.dob_month).padStart(2,'0')}-${String(form.dob_day).padStart(2,'0')}`
        : null

      const { data: participant, error: pErr } = await supabase
        .from('participants')
        .upsert({
          first_name: form.first_name, last_name: form.last_name,
          email: form.email, phone: form.phone || null,
          date_of_birth: dob,
          preferred_contact: form.preferred_contact || null,
          special_considerations: form.special_considerations || null,
          heard_about_us: form.heard_about_us || null,
          country: form.country || null, gender: form.gender || null,
          ethnicity: form.ethnicity.length ? form.ethnicity : null,
          income_sources: form.income_sources.length ? form.income_sources : null,
          newcomer_to_canada: form.newcomer_to_canada || null,
          accommodation_type: form.accommodation_type || null,
          household_composition: form.household_composition || null,
          consent_given: true, privacy_policy_accepted: true,
        }, { onConflict: 'email' })
        .select().single()

      if (pErr) throw pErr

      const { error: rErr } = await supabase
        .from('registrations')
        .insert({ course_id: course.id, participant_id: participant.id })

      if (rErr) {
        if (rErr.code === '23505') throw new Error('You are already registered for this course.')
        throw rErr
      }
      setStep('success')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-[#1B2A4A] text-white">
        <div className="max-w-5xl mx-auto px-4 py-5 flex items-center gap-3">
          <Link href="/" className="text-teal-300 hover:text-white text-sm">← All Courses</Link>
          <span className="text-gray-500">/</span>
          <span className="text-sm text-gray-300 truncate">{course.title}</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Course detail */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="h-1.5 bg-[#0D9488]" />
              <div className="p-6">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="text-xs font-semibold bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full">{course.regions?.name}</span>
                  {course.is_recurring && <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Recurring</span>}
                  {full && <span className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full font-semibold">Course Full</span>}
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-3">{course.title}</h1>
                <p className="text-gray-600 leading-relaxed mb-6">{course.description}</p>
                <div className="space-y-3 text-sm">
                  <Detail icon="📅" label="Date & Time" value={`${format(start, 'EEEE, MMMM d, yyyy')} · ${format(start, 'h:mm a')} – ${format(end, 'h:mm a')}`} />
                  {course.location && <Detail icon="📍" label="Location" value={course.location} />}
                  {course.facilitator && <Detail icon="👤" label="Facilitator" value={course.facilitator} />}
                  {course.max_participants && (
                    <Detail icon="👥" label="Capacity" value={full ? `Full (${course.max_participants} participants)` : `${spotsLeft} of ${course.max_participants} spots remaining`} />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right panel */}
          <div className="lg:col-span-2">
            {step === 'success' ? (
              <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
                <div className="text-5xl mb-4">✅</div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">You're registered!</h2>
                <p className="text-gray-600 text-sm mb-1">Thank you, <strong>{form.first_name}</strong>. Your registration for <strong>{course.title}</strong> is confirmed.</p>
                <p className="text-gray-400 text-xs mb-6">Keep an eye on your email for reminders before the course starts.</p>
                <Link href="/" className="inline-block bg-[#0D9488] text-white font-semibold px-5 py-2.5 rounded-lg text-sm hover:bg-[#0f766e] transition">
                  Browse more courses
                </Link>
              </div>
            ) : step === 'form' ? (
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="bg-[#1B2A4A] text-white px-5 py-4">
                  <h2 className="font-bold">Attending Student Information</h2>
                  <p className="text-blue-200 text-xs mt-0.5">{course.title}</p>
                </div>
                <form onSubmit={handleSubmit} className="p-5 space-y-6 text-sm">

                  <Sec label="Contact Information">
                    <div className="grid grid-cols-2 gap-3">
                      <F label="First Name *" value={form.first_name} onChange={v => set('first_name', v)} required />
                      <F label="Last Name *" value={form.last_name} onChange={v => set('last_name', v)} required />
                    </div>
                    <F label="Email *" type="email" value={form.email} onChange={v => set('email', v)} required placeholder="john.smith@example.com" />
                    <F label="Phone Number (e.g. 7801112222)" type="tel" value={form.phone} onChange={v => set('phone', v)} placeholder="780-111-2222 (10 digits)" />

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Date of Birth</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { key: 'dob_year', placeholder: 'Year', opts: Array.from({length:100},(_,i)=>new Date().getFullYear()-i) },
                          { key: 'dob_month', placeholder: 'Month', opts: ['January','February','March','April','May','June','July','August','September','October','November','December'], isMonth: true },
                          { key: 'dob_day', placeholder: 'Day', opts: Array.from({length:31},(_,i)=>i+1) },
                        ].map(({ key, placeholder, opts, isMonth }) => (
                          <select key={key} value={form[key]} onChange={e => set(key, e.target.value)}
                            className="border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white">
                            <option value="">{placeholder}</option>
                            {opts.map((o, i) => <option key={o} value={isMonth ? i+1 : o}>{o}</option>)}
                          </select>
                        ))}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">If under 18, a completed parental permission form is required.</p>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">How would you prefer to be contacted?</label>
                      <div className="flex gap-4">
                        {['Email','Phone'].map(o => (
                          <label key={o} className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="pref_contact" value={o} checked={form.preferred_contact===o} onChange={() => set('preferred_contact', o)} className="accent-teal-600" />
                            <span>{o}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <F label="Do you require any special considerations? (e.g. mobility)" value={form.special_considerations} onChange={v => set('special_considerations', v)} />

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2">Where did you learn about Recovery College?</label>
                      <div className="grid grid-cols-2 gap-y-1.5 gap-x-2">
                        {['Social media','Search engine','Billboard','Referral','E-mail','Radio','Newspaper','Other social organization','Word of mouth','Prefer not to answer','Another source not listed'].map(o => (
                          <label key={o} className="flex items-start gap-1.5 cursor-pointer">
                            <input type="radio" name="heard" value={o} checked={form.heard_about_us===o} onChange={() => set('heard_about_us', o)} className="accent-teal-600 mt-0.5 shrink-0" />
                            <span className="text-xs">{o}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </Sec>

                  <Sec label="Demographics">
                    <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3 leading-relaxed">
                      You have the option to decline any of these questions. Our goal is to better understand the individuals who attend our programs. This information is collected under FOIPPA Section 33(c) and PIPA for program evaluation and planning. Data will not be shared beyond CMHA's funders and CMHA, where it will be aggregated and reported without identifying information.
                    </p>

                    <F label="Where do you live? (Country)" value={form.country} onChange={v => set('country', v)} placeholder="e.g. Canada" />

                    <Sel label="What gender do you identify with?" value={form.gender} onChange={v => set('gender', v)}
                      opts={['Woman','Man','Non-binary','Two-Spirit','Prefer not to answer','Another gender identity not listed']} />

                    <Checks label="What ethnicity or ethnicities best describe you? (Select all that apply)"
                      opts={['Black','East Asian','Indigenous','Latin America','Southeast Asian','South Asian','West Asian','White','Prefer not to answer','Another ethnicity not listed']}
                      selected={form.ethnicity} onToggle={v => toggle('ethnicity', v)} />

                    <Checks label="What are your income sources? (Select all that apply)"
                      opts={['Full-time employment','Part-time employment','Self-employed',"Partner/spouse's income",'Investment income','Alimony/child support','Disability benefits (i.e., AISH)','Seniors benefits (i.e., CPP and OAS)','Employment Insurance (EI)','Student loans','Prefer not to answer','Another income source not listed']}
                      selected={form.income_sources} onToggle={v => toggle('income_sources', v)} />

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Are you a newcomer to Canada? (Moved/immigrated within the last 5 years)</label>
                      <div className="flex gap-4">
                        {['Yes','No','Prefer not to answer'].map(o => (
                          <label key={o} className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="newcomer" value={o} checked={form.newcomer_to_canada===o} onChange={() => set('newcomer_to_canada', o)} className="accent-teal-600" />
                            <span className="text-xs">{o}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <Sel label="What type of accommodation do you live in?" value={form.accommodation_type} onChange={v => set('accommodation_type', v)}
                      opts={['Renting','Owned Property','Subsidized/funded housing','No permanent accommodation','Prefer not to answer','Another housing arrangement not listed']} />

                    <Sel label="What is your current family/household composition?" value={form.household_composition} onChange={v => set('household_composition', v)}
                      opts={['Live alone','Live with a partner/spouse','Live with children/dependants','Live with other family members','Live with roommates','Prefer not to answer','Another living arrangement not listed']} />
                  </Sec>

                  <Sec label="Information Sharing and Consent">
                    <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3 leading-relaxed">
                      The purpose of the Recovery College Registration / Demographics Form is to obtain learner contact information and demographics for the learner record, and to connect learners to specific programs. Information is collected under FOIPPA Section 33(c). CMHA will store information in a secured internal database for the purpose of program planning, management, evaluation, and reporting. Data will not be shared beyond CMHA's funders and CMHA, where it will be aggregated and reported without identifying information. For more information, refer to CMHA Central Privacy Policy.
                    </p>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input type="checkbox" checked={form.consent_given} onChange={e => set('consent_given', e.target.checked)} className="accent-teal-600 mt-0.5 shrink-0" />
                      <span className="text-xs text-gray-700">I consent to providing my information to Recovery College.</span>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input type="checkbox" checked={form.privacy_policy_accepted} onChange={e => set('privacy_policy_accepted', e.target.checked)} className="accent-teal-600 mt-0.5 shrink-0" />
                      <span className="text-xs text-gray-700">I agree with and accept the Privacy Policy.</span>
                    </label>
                    {form.consent_given && !form.privacy_policy_accepted && (
                      <p className="text-xs text-red-600 bg-red-50 rounded p-2">
                        Thank you, but we will not be able to proceed without your acceptance of our privacy policy. Please contact <a href="mailto:recoverycollege@reddeer.cmha.ab.ca" className="underline">recoverycollege@reddeer.cmha.ab.ca</a> or (403) 967-0475 for more information.
                      </p>
                    )}
                  </Sec>

                  {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}

                  <div className="flex gap-3 pt-1">
                    <button type="button" onClick={() => setStep('info')} className="flex-1 border text-gray-600 font-medium py-2.5 rounded-lg hover:bg-gray-50 transition text-sm">Back</button>
                    <button type="submit" disabled={submitting} className="flex-1 bg-[#0D9488] text-white font-semibold py-2.5 rounded-lg hover:bg-[#0f766e] transition text-sm disabled:opacity-60">
                      {submitting ? 'Submitting...' : 'Complete Registration'}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="font-bold text-gray-900 mb-1">Register for this course</h2>
                <p className="text-sm text-gray-500 mb-5">Free to attend · Takes about 3 minutes · Your information is kept private.</p>
                {full ? (
                  <div className="text-center py-4">
                    <p className="text-gray-500 text-sm mb-3">This course is currently full.</p>
                    <Link href="/" className="text-teal-600 text-sm underline">Browse other courses</Link>
                  </div>
                ) : (
                  <>
                    {spotsLeft !== null && spotsLeft <= 5 && (
                      <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
                        ⚠️ Only {spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} remaining
                      </div>
                    )}
                    <button onClick={() => setStep('form')} className="w-full bg-[#0D9488] text-white font-semibold py-3 rounded-lg hover:bg-[#0f766e] transition">
                      Register Now →
                    </button>
                    <p className="text-xs text-gray-400 text-center mt-3">No account required</p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

function Detail({ icon, label, value }) {
  return (
    <div className="flex gap-3">
      <span>{icon}</span>
      <div>
        <div className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</div>
        <div className="text-gray-700">{value}</div>
      </div>
    </div>
  )
}
function Sec({ label, children }) {
  return (
    <div>
      <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 pb-1.5 border-b">{label}</div>
      <div className="space-y-3">{children}</div>
    </div>
  )
}
function F({ label, type='text', value, onChange, required, placeholder }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} required={required} placeholder={placeholder}
        className="w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent" />
    </div>
  )
}
function Sel({ label, value, onChange, opts }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white">
        <option value="">Select One</option>
        {opts.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}
function Checks({ label, opts, selected, onToggle }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-2">{label}</label>
      <div className="space-y-1.5">
        {opts.map(o => (
          <label key={o} className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={selected.includes(o)} onChange={() => onToggle(o)} className="accent-teal-600 shrink-0" />
            <span className="text-xs text-gray-700">{o}</span>
          </label>
        ))}
      </div>
    </div>
  )
}
