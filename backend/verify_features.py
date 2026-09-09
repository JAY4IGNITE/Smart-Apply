import asyncio
from dotenv import load_dotenv
load_dotenv('.env')
from app.database import init_db, close_db
from app.models.user import User
from app.models.resume import Resume
from app.services.auth_service import create_access_token
import httpx

async def verify():
    await init_db()
    users = await User.find().to_list()
    user = users[0]
    token = create_access_token({'sub': user.email})
    headers = {'Authorization': f'Bearer {token}'}
    
    async with httpx.AsyncClient(base_url='http://127.0.0.1:8000', timeout=60.0) as client:
        # 1. Test Project Recommend
        print('=== 1. Testing /api/projects/recommend ===')
        r_rec = await client.post('/api/projects/recommend', headers=headers, json={
            'skills': 'React, Python, TypeScript',
            'time_commitment': '15 hours/week',
            'interests': 'AI developer tools'
        })
        print('Recommend Status:', r_rec.status_code)
        rec_data = r_rec.json()
        print(f'Projects returned: {len(rec_data)}')
        for p in rec_data[:2]:
            print(f" - {p.get('title')} (rating: {p.get('rating')}, techs: {p.get('key_technologies')})")
            
        # 2. Test Project Roadmap
        print('\n=== 2. Testing /api/projects/roadmap ===')
        selected_proj = rec_data[0] if rec_data else {'title': 'AI Coding Assistant', 'description': 'Build an AI assistant', 'key_technologies': ['React', 'Python']}
        r_road = await client.post('/api/projects/roadmap', headers=headers, json={
            'project_details': selected_proj,
            'preferences': {'Preferred Database': 'PostgreSQL', 'Team Size': 'Solo'}
        })
        print('Roadmap Status:', r_road.status_code)
        road_data = r_road.json()
        phases = road_data.get('phases', [])
        print(f'Phases returned: {len(phases)}')
        for ph in phases[:2]:
            print(f" - Phase {ph.get('phase_number')}: {ph.get('title')} ({len(ph.get('tasks', []))} tasks)")

        # 3. Test Cover Letter Generate with saved resume
        print('\n=== 3. Testing /api/cover-letter/generate ===')
        resumes = await Resume.find(Resume.user_id == user.id).to_list()
        resume_id = str(resumes[0].id) if resumes else None
        print('Using resume_id:', resume_id)
        
        r_cl = await client.post('/api/cover-letter/generate', headers=headers, data={
            'job_description': 'Seeking an AI Engineer with expertise in Python, LLMs, and modern frontend frameworks.',
            'resume_id': resume_id
        })
        print('Cover Letter Status:', r_cl.status_code)
        cl_data = r_cl.json()
        cover_letter = cl_data.get('cover_letter', '')
        print(f'Cover letter length: {len(cover_letter)} chars, words: {len(cover_letter.split())}')
        print('Preview:\n', cover_letter[:250] + '...')

    await close_db()

if __name__ == '__main__':
    asyncio.run(verify())
